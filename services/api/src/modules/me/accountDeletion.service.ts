import type { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { createLogger } from '../../lib/logger';
import { queueEmailJob } from '../../infra/transactionalEmails';
import {
  canCancelDeletion,
  daysUntil,
  resolveDeletionSchedule,
  type PendingAccountDeletion,
} from './accountDeletion.contracts';
import { env } from '../../config/env';

const log = createLogger('accountDeletion');
const toIso = (value: string | Date): string => new Date(value).toISOString();

interface DeletionRow {
  id: string;
  status: string;
  created_at: string | Date;
  scheduled_for: string | Date | null;
}

const mapPending = (row: DeletionRow, now: Date): PendingAccountDeletion => {
  const scheduledFor = row.scheduled_for ? new Date(row.scheduled_for) : resolveDeletionSchedule(new Date(row.created_at));
  return {
    requestId: row.id,
    status: (row.status as PendingAccountDeletion['status']) ?? 'scheduled',
    requestedAt: toIso(row.created_at),
    scheduledFor: toIso(scheduledFor),
    daysRemaining: daysUntil(scheduledFor, now),
    graceDays: env.ACCOUNT_DELETION_GRACE_DAYS,
  };
};

/** The user's active (schedulable/cancellable) deletion request, if any. */
export async function getPendingAccountDeletion(userId: string): Promise<PendingAccountDeletion | null> {
  const result = await pool.query<DeletionRow>(
    `SELECT id, status, created_at, scheduled_for
       FROM privacy_requests
      WHERE user_id = $1 AND request_type = 'delete' AND status IN ('scheduled', 'processing')
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId],
  );
  const row = result.rows[0];
  return row ? mapPending(row, new Date()) : null;
}

/** Schedule the account for permanent deletion after the grace period. Idempotent per user. */
export async function scheduleAccountDeletion(
  userId: string,
  email: string,
  input: { fullName: string; notes?: string },
): Promise<PendingAccountDeletion> {
  const existing = await getPendingAccountDeletion(userId);
  if (existing && existing.status === 'scheduled') return existing;

  const now = new Date();
  const scheduledFor = resolveDeletionSchedule(now);

  const result = await pool.query<DeletionRow>(
    `INSERT INTO privacy_requests (user_id, request_type, status, scheduled_for, payload)
     VALUES ($1, 'delete', 'scheduled', $2, $3::jsonb)
     RETURNING id, status, created_at, scheduled_for`,
    [userId, scheduledFor.toISOString(), JSON.stringify({ notes: input.notes ?? '', fullName: input.fullName })],
  );
  const pending = mapPending(result.rows[0], now);

  const purgeDate = pending.scheduledFor.slice(0, 10);
  const dayLabel = `${pending.daysRemaining} day${pending.daysRemaining === 1 ? '' : 's'}`;
  const lines = [
    `We received a request to delete your ClaudyGod account.`,
    `Your account and its data will be permanently deleted on ${purgeDate} (in about ${dayLabel}).`,
    `If you did not request this, or you change your mind, open the app and go to ` +
      `Settings → Privacy & Security → "Cancel deletion" before that date.`,
    `After deletion this cannot be undone.`,
  ];
  await queueEmailJob({
    recipients: [email],
    subject: 'Your ClaudyGod account is scheduled for deletion',
    textBody: [`Hello ${input.fullName},`, '', ...lines].join('\n'),
    htmlBody: lines.map((line) => `<p>${line}</p>`).join(''),
    jobType: 'account_deletion_scheduled',
    templateKey: 'account.deletion-scheduled',
    payload: { userId, scheduledFor: pending.scheduledFor, type: 'account_deletion_scheduled' },
  }).catch((error) => {
    log.error('deletion-scheduled email failed to queue', { userId, error: String(error) });
  });

  log.info('account deletion scheduled', { userId, scheduledFor: pending.scheduledFor });
  return pending;
}

/** User-initiated cancellation, allowed any time before the purge runs. */
export async function cancelAccountDeletion(userId: string): Promise<{ cancelled: boolean }> {
  const result = await pool.query<DeletionRow>(
    `SELECT id, status, created_at, scheduled_for
       FROM privacy_requests
      WHERE user_id = $1 AND request_type = 'delete' AND status = 'scheduled'
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row || !row.scheduled_for || !canCancelDeletion(row.status, new Date(row.scheduled_for), new Date())) {
    return { cancelled: false };
  }
  await pool.query(
    `UPDATE privacy_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [row.id],
  );
  log.info('account deletion cancelled by user', { userId, requestId: row.id });
  return { cancelled: true };
}

/**
 * Worker job: purge every account whose deletion window has elapsed.
 * Deleting the `app_users` row cascades to all owned data; `ON DELETE SET NULL`
 * rows (audit logs, ratings) are de-associated. An audit row is written first so
 * the completion survives the cascade.
 */
export async function processDueAccountDeletions(limit = 50): Promise<{ processed: number; failed: number }> {
  const due = await pool.query<{ id: string; user_id: string; created_at: string | Date }>(
    `SELECT id, user_id, created_at
       FROM privacy_requests
      WHERE request_type = 'delete'
        AND status = 'scheduled'
        AND processed_at IS NULL
        AND scheduled_for IS NOT NULL
        AND scheduled_for <= NOW()
      ORDER BY scheduled_for ASC
      LIMIT $1`,
    [limit],
  );

  let processed = 0;
  let failed = 0;

  for (const request of due.rows) {
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      // Re-check under a row lock so a concurrent cancel wins.
      const locked = await client.query<{ status: string }>(
        `SELECT status FROM privacy_requests WHERE id = $1 FOR UPDATE`,
        [request.id],
      );
      if (locked.rows[0]?.status !== 'scheduled') {
        await client.query('ROLLBACK');
        continue;
      }
      await client.query(
        `INSERT INTO account_deletion_audit (privacy_request_id, prior_user_id, requested_at)
         VALUES ($1, $2, $3)`,
        [request.id, request.user_id, new Date(request.created_at).toISOString()],
      );
      // The privacy_requests row is itself ON DELETE CASCADE from app_users, so
      // stamp it completed *before* removing the user or it disappears unrecorded.
      await client.query(
        `UPDATE privacy_requests SET status = 'completed', processed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [request.id],
      );
      await client.query(`DELETE FROM app_users WHERE id = $1`, [request.user_id]);
      await client.query('COMMIT');
      processed += 1;
      log.info('account permanently deleted', { requestId: request.id });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      failed += 1;
      log.error('account deletion failed', { requestId: request.id, error: String(error) });
    } finally {
      client.release();
    }
  }

  if (processed || failed) log.info('processed due account deletions', { processed, failed });
  return { processed, failed };
}

import { pool } from '../db/pool';
import { createLogger } from '../lib/logger';
import { emailQueue } from './emailQueue';

const log = createLogger('emailOutbox');

export const emailQueueJobId = (emailJobId: number): string => `email-outbox-${emailJobId}`;

export async function dispatchEmailJob(emailJobId: number): Promise<string> {
  const deterministicId = emailQueueJobId(emailJobId);
  const existing = await emailQueue.getJob(deterministicId);
  if (existing && ['failed', 'completed'].includes(await existing.getState())) await existing.remove();
  const queued = await emailQueue.add('email-job', { emailJobId }, { jobId: deterministicId });
  await pool.query(
    `UPDATE email_jobs SET queue_job_id = $2, error = NULL, updated_at = NOW()
     WHERE id = $1 AND status = 'pending'`,
    [emailJobId, String(queued.id)],
  );
  return String(queued.id);
}

export async function reconcilePendingEmailJobs(limit = 100): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `SELECT id FROM email_jobs
     WHERE status = 'pending' AND queue_job_id IS NULL
     ORDER BY created_at ASC LIMIT $1`,
    [limit],
  );
  let dispatched = 0;
  for (const row of result.rows) {
    try {
      await dispatchEmailJob(row.id);
      dispatched += 1;
    } catch (error) {
      log.warn('Email outbox dispatch deferred', { emailJobId: row.id, error: error instanceof Error ? error.message : String(error) });
    }
  }
  if (dispatched > 0) log.info('Email outbox reconciled', { dispatched });
  return dispatched;
}

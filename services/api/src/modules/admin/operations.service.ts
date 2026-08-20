import { pool } from '../../db/pool';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { dispatchContentJob } from '../../queues/contentOutbox';
import type { ContentEventType } from '../../queues/contentQueue';
import { dispatchEmailJob } from '../../queues/emailOutbox';
import { dispatchMediaJob } from '../../queues/mediaOutbox';

export type OperationalJobKind = 'content' | 'email' | 'media';
export type OperationalJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'quarantined';

export interface OperationalJob {
  id: string;
  kind: OperationalJobKind;
  type: string;
  status: OperationalJobStatus;
  summary: string;
  error: string | null;
  createdAt: string;
  processedAt: string | null;
}

export async function listOperationalJobs(input: { status?: OperationalJobStatus; limit: number }): Promise<{ jobs: OperationalJob[] }> {
  const result = await pool.query<{
    id: string; kind: OperationalJobKind; type: string; status: OperationalJobStatus;
    summary: string; error: string | null; created_at: string; processed_at: string | null;
  }>(
    `SELECT * FROM (
       SELECT id::text, 'content'::text AS kind, event_type AS type, status,
              COALESCE(payload->>'title', payload->>'contentId', content_id::text) AS summary,
              error, created_at, processed_at
       FROM content_jobs
       UNION ALL
       SELECT id::text, 'email'::text AS kind, job_type AS type, status,
              subject AS summary, error, created_at, processed_at
       FROM email_jobs
       UNION ALL
       SELECT j.id::text, 'media'::text AS kind, 'security.scan'::text AS type, j.status,
              s.original_file_name AS summary, j.error, j.created_at, j.processed_at
       FROM media_processing_jobs j
       JOIN upload_sessions s ON s.id = j.upload_session_id
     ) jobs
     WHERE ($1::text IS NULL OR status = $1)
     ORDER BY created_at DESC
     LIMIT $2`,
    [input.status ?? null, input.limit],
  );
  return {
    jobs: result.rows.map((row) => ({
      id: row.id, kind: row.kind, type: row.type, status: row.status, summary: row.summary,
      error: row.error, createdAt: new Date(row.created_at).toISOString(),
      processedAt: row.processed_at ? new Date(row.processed_at).toISOString() : null,
    })),
  };
}

export async function retryOperationalJob(kind: OperationalJobKind, id: number): Promise<{ dispatch: 'queued' | 'deferred' }> {
  if (kind === 'content') {
    const result = await pool.query<{ content_id: string; event_type: ContentEventType; payload: Record<string, unknown> }>(
      `UPDATE content_jobs SET status = 'pending', queue_job_id = NULL, error = NULL,
              processed_at = NULL, updated_at = NOW()
       WHERE id = $1 AND status = 'failed'
       RETURNING content_id, event_type, payload`,
      [id],
    );
    if (!result.rows[0]) throw new BadRequestError('Only a failed content job can be retried', 'JOB_NOT_RETRYABLE');
    try {
      await dispatchContentJob({ id, ...result.rows[0] });
      return { dispatch: 'queued' };
    } catch {
      return { dispatch: 'deferred' };
    }
  }

  if (kind === 'media') {
    const result = await pool.query<{ id: number; upload_session_id: string }>(
      `UPDATE media_processing_jobs SET status = 'pending', queue_job_id = NULL, error = NULL,
              processed_at = NULL, updated_at = NOW()
       WHERE id = $1 AND status = 'failed' RETURNING id, upload_session_id`, [id],
    );
    if (!result.rows[0]) throw new BadRequestError('Only a failed media job can be retried', 'JOB_NOT_RETRYABLE');
    await pool.query(`UPDATE upload_sessions SET trust_status = 'pending', scan_error = NULL WHERE id = $1`, [result.rows[0].upload_session_id]);
    try { await dispatchMediaJob(result.rows[0]); return { dispatch: 'queued' }; }
    catch { return { dispatch: 'deferred' }; }
  }

  const result = await pool.query<{ id: number }>(
    `UPDATE email_jobs SET status = 'pending', queue_job_id = NULL, error = NULL,
            processed_at = NULL, updated_at = NOW()
     WHERE id = $1 AND status = 'failed' RETURNING id`,
    [id],
  );
  if (!result.rows[0]) {
    const exists = await pool.query(`SELECT 1 FROM email_jobs WHERE id = $1`, [id]);
    if (!exists.rows[0]) throw new NotFoundError('Operational job not found', 'JOB_NOT_FOUND');
    throw new BadRequestError('Only a failed email job can be retried', 'JOB_NOT_RETRYABLE');
  }
  try {
    await dispatchEmailJob(id);
    return { dispatch: 'queued' };
  } catch {
    return { dispatch: 'deferred' };
  }
}

export async function listSecurityAuditEvents(limit: number): Promise<{ events: Array<{
  id: string; event: string; actor: string | null; actorEmail: string | null;
  ipAddress: string | null; metadata: Record<string, unknown>; createdAt: string;
}> }> {
  const result = await pool.query<{
    id: string; event: string; display_name: string | null; email: string | null;
    ip_address: string | null; metadata: Record<string, unknown>; created_at: string;
  }>(
    `SELECT sal.id::text, sal.event, u.display_name, u.email, sal.ip_address,
            sal.metadata, sal.created_at
     FROM security_audit_log sal
     LEFT JOIN app_users u ON u.id = sal.user_id
     ORDER BY sal.created_at DESC LIMIT $1`,
    [limit],
  );
  return { events: result.rows.map((row) => ({
    id: row.id, event: row.event, actor: row.display_name, actorEmail: row.email,
    ipAddress: row.ip_address, metadata: row.metadata ?? {}, createdAt: new Date(row.created_at).toISOString(),
  })) };
}

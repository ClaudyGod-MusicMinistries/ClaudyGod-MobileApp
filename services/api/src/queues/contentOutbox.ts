import { pool } from '../db/pool';
import { createLogger } from '../lib/logger';
import { contentQueue, type ContentEventType } from './contentQueue';

const log = createLogger('contentOutbox');

interface PendingContentJob {
  id: number;
  content_id: string;
  event_type: ContentEventType;
  payload: Record<string, unknown>;
}

export const contentQueueJobId = (jobRecordId: number): string => `content-outbox-${jobRecordId}`;

export async function dispatchContentJob(job: PendingContentJob): Promise<string> {
  const deterministicId = contentQueueJobId(job.id);
  const existing = await contentQueue.getJob(deterministicId);
  if (existing && ['failed', 'completed'].includes(await existing.getState())) await existing.remove();
  const authorId = typeof job.payload.authorId === 'string' ? job.payload.authorId : '';
  const queued = await contentQueue.add(
    'content-event',
    { jobRecordId: job.id, contentId: job.content_id, authorId, eventType: job.event_type },
    { jobId: deterministicId },
  );
  await pool.query(
    `UPDATE content_jobs SET queue_job_id = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'pending'`,
    [job.id, String(queued.id)],
  );
  return String(queued.id);
}

export async function reconcilePendingContentJobs(limit = 100): Promise<number> {
  const result = await pool.query<PendingContentJob>(
    `SELECT id, content_id, event_type, payload
     FROM content_jobs
     WHERE status = 'pending' AND queue_job_id IS NULL
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit],
  );

  let dispatched = 0;
  for (const job of result.rows) {
    try {
      await dispatchContentJob(job);
      dispatched += 1;
    } catch (error) {
      log.warn('Content outbox dispatch deferred', {
        jobRecordId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  if (dispatched > 0) log.info('Content outbox reconciled', { dispatched });
  return dispatched;
}

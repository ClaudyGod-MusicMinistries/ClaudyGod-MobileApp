import { pool } from '../db/pool';
import { createLogger } from '../lib/logger';
import { mediaQueue } from './mediaQueue';

const log = createLogger('mediaOutbox');
interface PendingMediaJob { id: number; upload_session_id: string }
const jobId = (id: number) => `media-outbox-${id}`;

export async function dispatchMediaJob(job: PendingMediaJob): Promise<string> {
  const deterministicId = jobId(job.id);
  const existing = await mediaQueue.getJob(deterministicId);
  if (existing && ['failed', 'completed'].includes(await existing.getState())) await existing.remove();
  const queued = await mediaQueue.add('scan-upload', {
    mediaJobId: job.id,
    uploadSessionId: job.upload_session_id,
  }, { jobId: deterministicId });
  await pool.query(
    `UPDATE media_processing_jobs SET queue_job_id = $2, updated_at = NOW() WHERE id = $1 AND status = 'pending'`,
    [job.id, String(queued.id)],
  );
  return String(queued.id);
}

export async function reconcilePendingMediaJobs(limit = 100): Promise<number> {
  const result = await pool.query<PendingMediaJob>(
    `SELECT id, upload_session_id FROM media_processing_jobs
     WHERE status = 'pending' AND queue_job_id IS NULL ORDER BY created_at ASC LIMIT $1`, [limit],
  );
  let dispatched = 0;
  for (const job of result.rows) {
    try { await dispatchMediaJob(job); dispatched += 1; }
    catch (error) { log.warn('Media scan dispatch deferred', { mediaJobId: job.id, error: String(error) }); }
  }
  return dispatched;
}

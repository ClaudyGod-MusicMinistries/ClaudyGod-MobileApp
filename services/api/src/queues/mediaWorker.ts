import { Worker } from 'bullmq';
import { bullmqConnection } from '../infra/bullmq';
import { pool } from '../db/pool';
import { getObjectStream, deleteObject } from '../infra/s3';
import { scanStream } from '../infra/clamav';
import { createLogger } from '../lib/logger';
import { MEDIA_QUEUE_NAME, type MediaQueuePayload } from './mediaQueue';

const log = createLogger('mediaWorker');

export const startMediaWorker = (): Worker<MediaQueuePayload> => new Worker<MediaQueuePayload>(
  MEDIA_QUEUE_NAME,
  async (job) => {
    const { mediaJobId, uploadSessionId } = job.data;
    const claimed = await pool.query<{ storage_bucket: string; storage_path: string }>(
      `UPDATE media_processing_jobs j SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
       FROM upload_sessions s
       WHERE j.id = $1 AND j.upload_session_id = s.id AND j.status IN ('pending', 'processing')
       RETURNING s.storage_bucket, s.storage_path`, [mediaJobId],
    );
    const upload = claimed.rows[0];
    if (!upload) return { skipped: true };
    await pool.query(`UPDATE upload_sessions SET trust_status = 'scanning', scan_error = NULL WHERE id = $1`, [uploadSessionId]);
    try {
      const result = await scanStream(await getObjectStream({ bucket: upload.storage_bucket, key: upload.storage_path }));
      if (!result.clean) {
        await deleteObject({ bucket: upload.storage_bucket, key: upload.storage_path }).catch(() => undefined);
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`UPDATE upload_sessions SET trust_status = 'quarantined', scan_result = $2, scanned_at = NOW() WHERE id = $1`, [uploadSessionId, result]);
          await client.query(`UPDATE media_processing_jobs SET status = 'quarantined', result = $2, processed_at = NOW(), updated_at = NOW() WHERE id = $1`, [mediaJobId, result]);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally { client.release(); }
        log.warn('Malware upload quarantined and object removed', { uploadSessionId, signature: result.signature });
        return { clean: false };
      }
      await pool.query(`UPDATE upload_sessions SET trust_status = 'clean', scan_result = $2, scanned_at = NOW(), scan_error = NULL WHERE id = $1`, [uploadSessionId, result]);
      await pool.query(`UPDATE media_processing_jobs SET status = 'completed', result = $2, processed_at = NOW(), updated_at = NOW() WHERE id = $1`, [mediaJobId, result]);
      return { clean: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      await pool.query(`UPDATE upload_sessions SET trust_status = 'error', scan_error = $2 WHERE id = $1`, [uploadSessionId, reason]);
      await pool.query(`UPDATE media_processing_jobs SET status = 'failed', error = $2, processed_at = NOW(), updated_at = NOW() WHERE id = $1`, [mediaJobId, reason]);
      throw error;
    }
  },
  { connection: bullmqConnection, concurrency: 2 },
);

import { Worker } from 'bullmq';
import { pool } from '../db/pool';
import { redis } from '../infra/redis';
import { CONTENT_QUEUE_NAME, type ContentQueuePayload } from './contentQueue';

const markAsFailed = async (jobRecordId: number, reason: string): Promise<void> => {
  await pool.query(
    `UPDATE content_jobs
     SET status = 'failed',
         error = $2,
         processed_at = NOW()
     WHERE id = $1`,
    [jobRecordId, reason],
  );
};

export const startContentWorker = (): Worker<ContentQueuePayload> => {
  const worker = new Worker<ContentQueuePayload>(
    CONTENT_QUEUE_NAME,
    async (job) => {
      const { jobRecordId } = job.data;

      await pool.query(
        `UPDATE content_jobs
         SET status = 'processing'
         WHERE id = $1`,
        [jobRecordId],
      );

      try {
        await pool.query(
          `UPDATE content_jobs
           SET status = 'completed',
               processed_at = NOW()
           WHERE id = $1`,
          [jobRecordId],
        );

        return { success: true };
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown worker error';
        await markAsFailed(jobRecordId, reason);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 8,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[worker] Completed job ${job?.id}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[worker] Failed job ${job?.id}: ${error.message}`);
  });

  return worker;
};

import { Worker } from 'bullmq';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { logger } from '../lib/logger';
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
      connection: {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
        enableAutoPipelining: true,
      },
      concurrency: 8,
    },
  );

  worker.on('completed', (job) => {
    logger.info('Content job completed', { jobId: job?.id });
  });

  worker.on('failed', (job, error) => {
    logger.error('Content job failed', { jobId: job?.id, error: error.message });
  });

  return worker;
};

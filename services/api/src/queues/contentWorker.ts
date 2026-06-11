import { Worker } from 'bullmq';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';
import { CacheService } from '../lib/cache';
import { CONTENT_QUEUE_NAME, type ContentQueuePayload, type ContentEventType } from './contentQueue';

const log = createLogger('contentWorker');

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

const handleContentEvent = async (eventType: ContentEventType, contentId: string): Promise<void> => {
  await CacheService.invalidateContentCache(contentId);

  if (eventType === 'content.deleted') {
    await Promise.all([
      pool.query(`DELETE FROM trending_snapshots WHERE content_id = $1::uuid`, [contentId]),
      pool.query(`DELETE FROM content_item_stats WHERE content_id = $1::uuid`, [contentId]),
    ]);
    log.info('Content removed from trending and stats on delete', { contentId });
  }

  log.info('Content event handled', { eventType, contentId });
};

export const startContentWorker = (): Worker<ContentQueuePayload> => {
  const worker = new Worker<ContentQueuePayload>(
    CONTENT_QUEUE_NAME,
    async (job) => {
      const { jobRecordId, contentId, eventType } = job.data;

      await pool.query(
        `UPDATE content_jobs
         SET status = 'processing'
         WHERE id = $1`,
        [jobRecordId],
      );

      try {
        await handleContentEvent(eventType, contentId);

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
    log.info('Content job completed', { jobId: job?.id, eventType: job?.data.eventType });
  });

  worker.on('failed', (job, error) => {
    log.error('Content job failed', { jobId: job?.id, error: error.message });
  });

  return worker;
};

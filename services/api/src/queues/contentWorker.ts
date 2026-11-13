import { Worker } from 'bullmq';
import { pool } from '../db/pool';
import { bullmqWorkerConnection } from '../infra/bullmq';
import { sendContentBroadcastNotification } from '../infra/push';
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

  if (eventType === 'content.published') {
    try {
      const contentRes = await pool.query<{
        title: string;
        description: string;
        content_type: string;
        thumbnail_url: string | null;
        author_id: string;
      }>(
        `SELECT title, description, content_type, thumbnail_url, author_id
         FROM content_items
         WHERE id = $1 AND visibility = 'published' AND deleted_at IS NULL`,
        [contentId],
      );

      if (contentRes.rows.length > 0) {
        const item = contentRes.rows[0]!;
        const typeLabel =
          item.content_type === 'video'
            ? 'New Video'
            : item.content_type === 'audio'
              ? 'New Release'
              : 'New Update';

        await sendContentBroadcastNotification({
          title: `${typeLabel}: ${item.title}`,
          body: item.description ? item.description.slice(0, 140) : `Listen to ${item.title} now on ClaudyGod.`,
          category: 'new_release',
          contentId,
          contentType: item.content_type,
          imageUrl: item.thumbnail_url ?? undefined,
          createdBy: item.author_id,
        });
        log.info('Automatic publish push notification dispatched', { contentId, title: item.title });
      }
    } catch (pushErr) {
      log.warn('Auto publish push notification failed', {
        contentId,
        error: pushErr instanceof Error ? pushErr.message : String(pushErr),
      });
    }
  }

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
      connection: bullmqWorkerConnection,
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

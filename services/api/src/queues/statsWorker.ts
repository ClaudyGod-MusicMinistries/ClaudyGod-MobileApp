import { Worker } from 'bullmq';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';
import { STATS_QUEUE_NAME, type StatsQueuePayload } from './statsQueue';

const log = createLogger('statsWorker');

const handlePlayRecorded = async (contentId: string): Promise<void> => {
  await pool.query(
    `INSERT INTO content_item_stats (content_id, play_count, unique_listeners, last_played_at, updated_at)
     SELECT id, 1, 1, NOW(), NOW()
     FROM content_items
     WHERE id = $1::uuid
     ON CONFLICT (content_id) DO UPDATE
     SET play_count       = content_item_stats.play_count + 1,
         unique_listeners = (
           SELECT COUNT(DISTINCT user_id)
           FROM user_play_events
           WHERE content_id = $1
         ),
         last_played_at   = NOW(),
         updated_at       = NOW()`,
    [contentId],
  );
};

const handleLikeToggled = async (contentId: string, liked: boolean): Promise<void> => {
  const delta = liked ? 1 : -1;
  await pool.query(
    `INSERT INTO content_item_stats (content_id, like_count, updated_at)
     SELECT id, GREATEST(0, $2), NOW()
     FROM content_items
     WHERE id = $1::uuid
     ON CONFLICT (content_id) DO UPDATE
     SET like_count = GREATEST(0, content_item_stats.like_count + $2),
         updated_at = NOW()`,
    [contentId, delta],
  );
};

const handleShareRecorded = async (contentId: string): Promise<void> => {
  await pool.query(
    `INSERT INTO content_item_stats (content_id, share_count, updated_at)
     SELECT id, 1, NOW()
     FROM content_items
     WHERE id = $1::uuid
     ON CONFLICT (content_id) DO UPDATE
     SET share_count = content_item_stats.share_count + 1,
         updated_at  = NOW()`,
    [contentId],
  );
};

export const startStatsWorker = (): Worker<StatsQueuePayload> => {
  const worker = new Worker<StatsQueuePayload>(
    STATS_QUEUE_NAME,
    async (job) => {
      const { eventType, contentId, liked } = job.data;

      switch (eventType) {
        case 'stats.play_recorded':
          await handlePlayRecorded(contentId);
          break;
        case 'stats.like_toggled':
          await handleLikeToggled(contentId, liked ?? true);
          break;
        case 'stats.share_recorded':
          await handleShareRecorded(contentId);
          break;
        default:
          log.warn('Unknown stats event type', { eventType });
      }
    },
    {
      connection: {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
        enableAutoPipelining: true,
      },
      concurrency: 20,
    },
  );

  worker.on('completed', (job) => {
    log.info('Stats job completed', { jobId: job?.id, eventType: job?.data.eventType });
  });

  worker.on('failed', (job, error) => {
    log.error('Stats job failed', { jobId: job?.id, error: error.message });
  });

  return worker;
};

import { Worker } from 'bullmq';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';
import { TRENDING_QUEUE_NAME, type TrendingQueuePayload, type TrendingPeriod } from './trendingQueue';

const log = createLogger('trendingWorker');

const windowHours: Record<TrendingPeriod, number> = {
  hourly: 1,
  daily: 24,
  weekly: 168,
};

const recalculateTrending = async (period: TrendingPeriod): Promise<void> => {
  const hours = windowHours[period];

  await pool.query(
    `WITH window_stats AS (
       SELECT
         e.content_id::uuid AS content_id,
         COUNT(*)                                              AS plays,
         COUNT(DISTINCT e.user_id)                            AS unique_listeners,
         COALESCE(s.like_count, 0)                            AS likes,
         COALESCE(s.skip_rate, 0)                             AS skip_rate,
         -- Wilson score lower bound variant for streaming platforms
         -- score = (plays * 1.0) + (unique_listeners * 2.5) + (likes * 4.0) - (skip_rate * plays * 1.5)
         (COUNT(*)::numeric * 1.0)
           + (COUNT(DISTINCT e.user_id)::numeric * 2.5)
           + (COALESCE(s.like_count, 0)::numeric * 4.0)
           - (COALESCE(s.skip_rate, 0) * COUNT(*)::numeric * 1.5) AS score
       FROM user_play_events e
       LEFT JOIN content_item_stats s ON s.content_id = e.content_id::uuid
       WHERE e.played_at > NOW() - ($1 || ' hours')::interval
         AND e.content_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       GROUP BY e.content_id, s.like_count, s.skip_rate
     ),
     ranked AS (
       SELECT
         ws.content_id,
         ws.score,
         ROW_NUMBER() OVER (ORDER BY ws.score DESC) AS rank
       FROM window_stats ws
       INNER JOIN content_items ci ON ci.id = ws.content_id AND ci.visibility = 'published'
     )
     INSERT INTO trending_snapshots (content_id, period, score, rank, calculated_at)
     SELECT content_id, $2, score, rank, NOW()
     FROM ranked
     ON CONFLICT (content_id, period, calculated_at)
     DO UPDATE SET score = EXCLUDED.score, rank = EXCLUDED.rank`,
    [hours, period],
  );

  await pool.query(
    `UPDATE content_item_stats cs
     SET trending_score = COALESCE(ts.score, 0),
         updated_at     = NOW()
     FROM (
       SELECT DISTINCT ON (content_id)
         content_id, score
       FROM trending_snapshots
       WHERE period = $1
       ORDER BY content_id, calculated_at DESC
     ) ts
     WHERE cs.content_id = ts.content_id`,
    [period],
  );

  log.info('Trending recalculated', { period, hours });
};

export const startTrendingWorker = (): Worker<TrendingQueuePayload> => {
  const worker = new Worker<TrendingQueuePayload>(
    TRENDING_QUEUE_NAME,
    async (job) => {
      await recalculateTrending(job.data.period);
    },
    {
      connection: {
        url: env.REDIS_URL,
        maxRetriesPerRequest: null,
        enableAutoPipelining: true,
      },
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    log.info('Trending job completed', { jobId: job?.id, period: job?.data.period });
  });

  worker.on('failed', (job, error) => {
    log.error('Trending job failed', { jobId: job?.id, error: error.message });
  });

  return worker;
};

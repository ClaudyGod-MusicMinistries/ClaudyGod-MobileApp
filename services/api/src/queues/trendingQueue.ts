import { Queue } from 'bullmq';
import { env } from '../config/env';

export const TRENDING_QUEUE_NAME = 'trending-scores';

export type TrendingPeriod = 'hourly' | 'daily' | 'weekly';

export interface TrendingQueuePayload {
  period: TrendingPeriod;
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const trendingQueue = new Queue<TrendingQueuePayload>(TRENDING_QUEUE_NAME, {
  connection: {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
    enableAutoPipelining: true,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: 10,
    removeOnFail: 50,
  },
});

export const scheduleTrendingJobs = async (): Promise<void> => {
  await trendingQueue.upsertJobScheduler(
    'trending-hourly',
    { every: FIFTEEN_MINUTES },
    { name: 'trending-hourly', data: { period: 'hourly' } },
  );

  await trendingQueue.upsertJobScheduler(
    'trending-daily',
    { every: 60 * 60 * 1000 },
    { name: 'trending-daily', data: { period: 'daily' } },
  );
};

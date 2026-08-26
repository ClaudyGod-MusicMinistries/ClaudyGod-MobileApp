import { Queue } from 'bullmq';
import { bullmqConnection, observeQueueErrors } from '../infra/bullmq';

export const STATS_QUEUE_NAME = 'content-stats';

export type StatsEventType =
  | 'stats.play_recorded'
  | 'stats.like_toggled'
  | 'stats.share_recorded';

export interface StatsQueuePayload {
  eventType: StatsEventType;
  contentId: string;
  userId: string;
  liked?: boolean;
  sessionId?: string;
}

export const statsQueue = new Queue<StatsQueuePayload>(STATS_QUEUE_NAME, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

observeQueueErrors(statsQueue, STATS_QUEUE_NAME);

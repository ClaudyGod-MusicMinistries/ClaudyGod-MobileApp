import { Queue } from 'bullmq';
import { redis } from '../infra/redis';

export const CONTENT_QUEUE_NAME = 'content-events';

export type ContentEventType = 'content.created' | 'content.published';

export interface ContentQueuePayload {
  jobRecordId: number;
  contentId: string;
  authorId: string;
  eventType: ContentEventType;
}

export const contentQueue = new Queue<ContentQueuePayload>(CONTENT_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
});

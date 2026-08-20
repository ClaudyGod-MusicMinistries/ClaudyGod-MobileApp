import { Queue } from 'bullmq';
import { env } from '../config/env';

export const MEDIA_QUEUE_NAME = 'media-security';
export interface MediaQueuePayload { mediaJobId: number; uploadSessionId: string }

export const mediaQueue = new Queue<MediaQueuePayload>(MEDIA_QUEUE_NAME, {
  connection: { url: env.REDIS_URL, maxRetriesPerRequest: null, enableAutoPipelining: true },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
});

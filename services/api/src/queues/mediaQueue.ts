import { Queue } from 'bullmq';
import { bullmqConnection, observeQueueErrors } from '../infra/bullmq';

export const MEDIA_QUEUE_NAME = 'media-security';
export interface MediaQueuePayload { mediaJobId: number; uploadSessionId: string }

export const mediaQueue = new Queue<MediaQueuePayload>(MEDIA_QUEUE_NAME, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
});

observeQueueErrors(mediaQueue, MEDIA_QUEUE_NAME);

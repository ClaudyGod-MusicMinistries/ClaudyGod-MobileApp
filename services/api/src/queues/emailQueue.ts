import { Queue } from 'bullmq';
import { env } from '../config/env';

export const EMAIL_QUEUE_NAME = 'email-events';

export interface EmailQueuePayload {
  emailJobId: number;
}

export const emailQueue = new Queue<EmailQueuePayload>(EMAIL_QUEUE_NAME, {
  connection: {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
    enableAutoPipelining: true,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
});

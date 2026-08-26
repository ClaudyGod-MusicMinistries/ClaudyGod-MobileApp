import { Queue } from 'bullmq';
import { bullmqConnection, observeQueueErrors } from '../infra/bullmq';

export const EMAIL_QUEUE_NAME = 'email-events';

export interface EmailQueuePayload {
  emailJobId: number;
}

export const emailQueue = new Queue<EmailQueuePayload>(EMAIL_QUEUE_NAME, {
  connection: bullmqConnection,
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

observeQueueErrors(emailQueue, EMAIL_QUEUE_NAME);

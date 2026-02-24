import { Queue } from 'bullmq';
import { createBullRedisConnection } from './redis.js';

export const QUEUE_NAMES = {
  email: 'email-notifications',
  contentEvents: 'content-events',
} as const;

export type EmailNotificationJob = {
  kind: 'content_published';
  to: string[];
  subject: string;
  text: string;
  html?: string;
  metadata?: Record<string, unknown>;
};

export type ContentEventJob = {
  kind: 'content_published';
  contentId: string;
  title: string;
  publishedBy: {
    id: string;
    email: string;
    displayName: string;
  };
};

const queueConnection = createBullRedisConnection();

export const emailQueue = new Queue<EmailNotificationJob>(QUEUE_NAMES.email, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 50,
    removeOnFail: 100,
    backoff: {
      type: 'exponential',
      delay: 2_000,
    },
  },
});

export const contentEventQueue = new Queue<ContentEventJob>(QUEUE_NAMES.contentEvents, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 5,
    removeOnComplete: 200,
    removeOnFail: 200,
    backoff: {
      type: 'exponential',
      delay: 1_500,
    },
  },
});

export async function closeQueues(): Promise<void> {
  await Promise.all([emailQueue.close(), contentEventQueue.close()]);
  await queueConnection.quit();
}

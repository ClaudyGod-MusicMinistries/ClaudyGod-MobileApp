import type { ConnectionOptions } from 'bullmq';
import type { Queue } from 'bullmq';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';

const log = createLogger('bullmq');

/** Queue producers run in the HTTP process and must fail before the proxy does. */
export const bullmqConnection: ConnectionOptions = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: 1,
  connectTimeout: 2_000,
  commandTimeout: 2_000,
  enableAutoPipelining: true,
};

/** BullMQ workers use blocking Redis commands and require unlimited retries. */
export const bullmqWorkerConnection: ConnectionOptions = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
  connectTimeout: 2_000,
  enableAutoPipelining: true,
};

export const observeQueueErrors = (queue: Queue, queueName: string): void => {
  // BullMQ queues are EventEmitters. Without an error listener, a transient
  // Redis disconnect can become an uncaught `error` event and terminate the
  // API process mid-response, which an edge proxy reports as a 502.
  queue.on('error', (error) => {
    log.error('Queue connection error', { queue: queueName, error: error.message });
  });
};

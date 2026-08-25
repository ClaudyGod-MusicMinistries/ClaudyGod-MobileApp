import type { ConnectionOptions } from 'bullmq';
import { env } from '../config/env';

/** Canonical BullMQ connection policy shared by every queue and worker. */
export const bullmqConnection: ConnectionOptions = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
  enableAutoPipelining: true,
};

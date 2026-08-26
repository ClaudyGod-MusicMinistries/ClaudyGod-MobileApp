import IORedis from 'ioredis';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';

const log = createLogger('redis');

export const redis = new IORedis(env.REDIS_URL, {
  // HTTP requests must never wait forever for Redis. A stalled limiter/cache
  // used to outlive Nginx's timeout and surface as a Cloudflare 502 instead of
  // an application response. Workers use their own blocking-safe connection.
  maxRetriesPerRequest: 1,
  connectTimeout: 2_000,
  commandTimeout: 2_000,
  enableAutoPipelining: true,
});

redis.on('error', (error) => {
  log.error('Redis connection error', { error: error.message });
});

export const closeRedis = async (): Promise<void> => {
  await redis.quit();
};

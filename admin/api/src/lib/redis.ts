import IORedis from 'ioredis';
import { config } from '../config/env.js';

export const redis = new IORedis(config.redis.url, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
});

export function createBullRedisConnection(): IORedis {
  return new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
}

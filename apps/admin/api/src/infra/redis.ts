import IORedis from 'ioredis';
import { env } from '../config/env';

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableAutoPipelining: true,
});

export const closeRedis = async (): Promise<void> => {
  await redis.quit();
};

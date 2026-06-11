import { redis } from '../infra/redis';
import { createLogger } from './logger';

const log = createLogger('cache');

export const CacheTTL = {
  USER_PROFILE: 300,
  USER_PREFERENCES: 600,
  CONTENT_FEED: 120,
  CONTENT_DETAIL: 300,
  APP_CONFIG: 600,
  TRENDING: 300,
  RECOMMENDATIONS: 180,
  SEARCH_RESULTS: 60,
  LIVE_SESSIONS: 30,
} as const;

const CACHE_VERSION = 'v1';

const buildKey = (namespace: string, id: string): string =>
  `cg:${CACHE_VERSION}:${namespace}:${id}`;

export const CacheService = {
  async get<T>(namespace: string, id: string): Promise<T | null> {
    const key = buildKey(namespace, id);
    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      log.warn('Cache get error', { key, err });
      return null;
    }
  },

  async set<T>(namespace: string, id: string, value: T, ttlSeconds: number): Promise<void> {
    const key = buildKey(namespace, id);
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      log.warn('Cache set error', { key, err });
    }
  },

  async del(namespace: string, id: string): Promise<void> {
    const key = buildKey(namespace, id);
    try {
      await redis.del(key);
    } catch (err) {
      log.warn('Cache del error', { key, err });
    }
  },

  async getOrSet<T>(
    namespace: string,
    id: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    const cached = await CacheService.get<T>(namespace, id);
    if (cached !== null) return cached;
    const value = await fetcher();
    await CacheService.set(namespace, id, value, ttlSeconds);
    return value;
  },

  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      await redis.del(...keys);
      return keys.length;
    } catch (err) {
      log.warn('Cache invalidate pattern error', { pattern, err });
      return 0;
    }
  },

  async invalidateUserCache(userId: string): Promise<void> {
    await CacheService.invalidateByPattern(`cg:${CACHE_VERSION}:user:${userId}*`);
    await CacheService.invalidateByPattern(`cg:${CACHE_VERSION}:rec:${userId}*`);
  },

  async invalidateContentCache(contentId: string): Promise<void> {
    await CacheService.invalidateByPattern(`cg:${CACHE_VERSION}:content:${contentId}*`);
    await CacheService.invalidateByPattern(`cg:${CACHE_VERSION}:feed:*`);
  },

  async ping(): Promise<boolean> {
    try {
      const result = await redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  },
};

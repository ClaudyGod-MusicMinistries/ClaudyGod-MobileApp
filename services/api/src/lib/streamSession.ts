import { redis } from '../infra/redis';
import { createLogger } from './logger';

const log = createLogger('streamSession');

const STREAM_SESSION_TTL = 3600;

const streamKey = (userId: string): string => `stream:active:${userId}`;

interface ActiveStream {
  deviceId: string;
  contentId: string;
  startedAt: string;
}

export const StreamLimits: Record<string, number> = {
  CLIENT: 1,
  ADMIN: 99,
};

export async function acquireStream(
  userId: string,
  deviceId: string,
  contentId: string,
  userRole: string,
): Promise<{ acquired: boolean; reason?: string }> {
  const key = streamKey(userId);
  const limit = StreamLimits[userRole.toUpperCase()] ?? 1;

  const existing = await redis.hgetall(key);
  const activeStreams: ActiveStream[] = Object.entries(existing)
    .map(([, v]) => {
      try {
        return JSON.parse(v) as ActiveStream;
      } catch {
        return null;
      }
    })
    .filter((s): s is ActiveStream => s !== null);

  if (activeStreams.length >= limit) {
    return {
      acquired: false,
      reason: `Stream limit reached (${limit}). End another stream to continue.`,
    };
  }

  const stream: ActiveStream = { deviceId, contentId, startedAt: new Date().toISOString() };
  await redis.hset(key, deviceId, JSON.stringify(stream));
  await redis.expire(key, STREAM_SESSION_TTL);

  log.info('Stream acquired', { userId, deviceId, contentId });
  return { acquired: true };
}

export async function releaseStream(userId: string, deviceId: string): Promise<void> {
  const key = streamKey(userId);
  await redis.hdel(key, deviceId);
  log.info('Stream released', { userId, deviceId });
}

export async function getActiveStreams(userId: string): Promise<ActiveStream[]> {
  const key = streamKey(userId);
  const raw = await redis.hgetall(key);

  return Object.entries(raw)
    .map(([, v]) => {
      try {
        return JSON.parse(v) as ActiveStream;
      } catch {
        return null;
      }
    })
    .filter((s): s is ActiveStream => s !== null);
}

export async function heartbeatStream(userId: string, deviceId: string): Promise<boolean> {
  const key = streamKey(userId);
  const exists = await redis.hexists(key, deviceId);
  if (!exists) return false;
  await redis.expire(key, STREAM_SESSION_TTL);
  return true;
}

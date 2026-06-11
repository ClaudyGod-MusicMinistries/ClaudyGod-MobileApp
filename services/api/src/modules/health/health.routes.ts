import { Router } from 'express';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { redis } from '../../infra/redis';
import { verifyEmailTransport } from '../../infra/email';
import { getWsServer } from '../../infra/websocket';
import { contentQueue } from '../../queues/contentQueue';
import { emailQueue } from '../../queues/emailQueue';
import { statsQueue } from '../../queues/statsQueue';
import { trendingQueue } from '../../queues/trendingQueue';

export const healthRouter = Router();

const capabilities = () => ({
  youtube: env.YOUTUBE_ENABLED,
  supabase: env.SUPABASE_ENABLED,
  databaseTarget: /supabase\./i.test(env.DATABASE_URL)
    ? 'supabase-postgres'
    : 'external-postgres',
  smtp: env.SMTP_ENABLED,
  smtpProvider: env.SMTP_PROVIDER_LABEL,
  mobileApiKeyConfigured: Boolean(env.MOBILE_API_KEY && env.MOBILE_API_KEY !== 'dev-mobile-api-key'),
});

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs) as unknown as NodeJS.Timeout;
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    name: 'ClaudyGod Admin API',
    status: 'ok',
    capabilities: capabilities(),
    docs: {
      health: '/health',
      auth: '/v1/auth',
      admin: '/v1/admin/dashboard',
      content: '/v1/content',
      mobile: '/v1/mobile',
      uploads: '/v1/uploads',
      youtube: '/v1/youtube',
    },
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/health', async (_req, res, next) => {
  try {
    let postgres: 'up' | 'down' = 'up';
    let schema: 'ready' | 'missing' | 'unknown' = 'unknown';
    let redisState: 'up' | 'down' = 'up';

    try {
      await withTimeout(pool.query('SELECT 1'), 2_000, 'Postgres health check timed out');
      const schemaResult = await withTimeout(pool.query<{ ready: boolean }>(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'schema_migrations'
        ) AS ready
      `), 2_000, 'Schema health check timed out');
      schema = schemaResult.rows[0]?.ready ? 'ready' : 'missing';
    } catch (_error) {
      postgres = 'down';
      schema = 'unknown';
    }

    try {
      await withTimeout(redis.ping(), 1_500, 'Redis health check timed out');
    } catch (_error) {
      redisState = 'down';
    }

    const status = postgres === 'up' && schema === 'ready' && redisState === 'up' ? 'ok' : 'degraded';

    const smtpStatus = await withTimeout(
      verifyEmailTransport(),
      1_500,
      'SMTP health check timed out',
    ).catch((error) => ({
      enabled: env.SMTP_ENABLED,
      reachable: false,
      reason: error instanceof Error ? error.message : 'SMTP health check failed',
    }));
    const smtpHealth = {
      enabled: smtpStatus.enabled,
      reachable: smtpStatus.reachable,
      reason: smtpStatus.reason,
      provider: env.SMTP_PROVIDER_LABEL,
    };

    const [contentCounts, emailCounts, statsCounts, trendingCounts] = await Promise.allSettled([
      contentQueue.getJobCounts(),
      emailQueue.getJobCounts(),
      statsQueue.getJobCounts(),
      trendingQueue.getJobCounts(),
    ]);

    const queueDepths = {
      content: contentCounts.status === 'fulfilled' ? contentCounts.value : null,
      email: emailCounts.status === 'fulfilled' ? emailCounts.value : null,
      stats: statsCounts.status === 'fulfilled' ? statsCounts.value : null,
      trending: trendingCounts.status === 'fulfilled' ? trendingCounts.value : null,
    };

    const wss = getWsServer();

    res.status(status === 'ok' ? 200 : 503).json({
      status,
      capabilities: capabilities(),
      services: {
        postgres,
        schema,
        redis: redisState,
      },
      smtp: smtpHealth,
      queues: queueDepths,
      websocket: { connections: wss?.clientCount ?? 0 },
      process: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

import { Router } from 'express';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { redis } from '../../infra/redis';
import { verifyEmailTransport } from '../../infra/email';

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
      await pool.query('SELECT 1');
      const schemaResult = await pool.query<{ ready: boolean }>(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'schema_migrations'
        ) AS ready
      `);
      schema = schemaResult.rows[0]?.ready ? 'ready' : 'missing';
    } catch (_error) {
      postgres = 'down';
      schema = 'unknown';
    }

    try {
      await redis.ping();
    } catch (_error) {
      redisState = 'down';
    }

    const status = postgres === 'up' && schema === 'ready' && redisState === 'up' ? 'ok' : 'degraded';

    const smtpStatus = await verifyEmailTransport();
    const smtpHealth = {
      enabled: smtpStatus.enabled,
      reachable: smtpStatus.reachable,
      reason: smtpStatus.reason,
      provider: env.SMTP_PROVIDER_LABEL,
    };

    res.status(status === 'ok' ? 200 : 503).json({
      status,
      capabilities: capabilities(),
      services: {
        postgres,
        schema,
        redis: redisState,
      },
      smtp: smtpHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

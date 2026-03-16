import { Router } from 'express';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { redis } from '../../infra/redis';

export const healthRouter = Router();

const capabilities = () => ({
  youtube: env.YOUTUBE_ENABLED,
  supabase: env.SUPABASE_ENABLED,
  smtp: env.SMTP_ENABLED,
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
    let redisState: 'up' | 'down' = 'up';

    try {
      await pool.query('SELECT 1');
    } catch (_error) {
      postgres = 'down';
    }

    try {
      await redis.ping();
    } catch (_error) {
      redisState = 'down';
    }

    const status = postgres === 'up' && redisState === 'up' ? 'ok' : 'degraded';

    res.status(status === 'ok' ? 200 : 503).json({
      status,
      capabilities: capabilities(),
      services: {
        postgres,
        redis: redisState,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

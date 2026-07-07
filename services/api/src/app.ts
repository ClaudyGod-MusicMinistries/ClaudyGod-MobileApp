import compression from 'compression';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import type { Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestTrackingMiddleware } from './middleware/requestTracking';
import { apiLimiter } from './middleware/rateLimiter';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { adminStorageRouter } from './modules/admin/storage.routes';
import { adminAiRouter } from './modules/ai/ai.routes';
import { adminAdsRouter } from './modules/ads/ads.routes';
import { adminAppConfigRouter, mobileAppConfigRouter } from './modules/appConfig/appConfig.routes';
import { authRouter } from './modules/auth/auth.routes';
import { mfaRouter } from './modules/auth/mfa.routes';
import { oauthRouter } from './modules/auth/oauth.routes';
import { biometricRouter } from './modules/auth/biometric.routes';
import { accountSecurityRouter } from './modules/auth/accountSecurity.routes';
import { contentRouter } from './modules/content/content.routes';
import { healthRouter } from './modules/health/health.routes';
import { legalRouter } from './modules/legal/legal.routes';
import { liveRouter } from './modules/live/live.routes';
import { meRouter } from './modules/me/me.routes';
import { mobileRouter } from './modules/mobile/mobile.routes';
import { youtubeRouter } from './modules/youtube/youtube.routes';
import { adminWordOfDayRouter, mobileWordOfDayRouter } from './modules/wordOfDay/wordOfDay.routes';
import engagementRouter from './modules/engagement/engagement.routes';
import { searchRouter } from './modules/search/search.routes';
import { devicesRouter } from './modules/devices/devices.routes';
import { getMetricsOutput, metricsContentType } from './lib/metrics';

const parseCorsOrigin = (): true | string[] => {
  const origins = env.CORS_ORIGINS;

  if (origins.length === 0 || origins.includes('*')) {
    return true;
  }

  return [
    ...new Set(
      origins.map((origin) => {
        try {
          return new URL(origin).origin;
        } catch {
          return origin.replace(/\/+$/, '');
        }
      }),
    ),
  ];
};

const isPrivateNetworkOrigin = (origin: string): boolean => {
  try {
    const { hostname, protocol } = new URL(origin);

    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname === 'host.docker.internal' ||
      hostname === '10.0.2.2'
    ) {
      return true;
    }

    if (hostname.endsWith('.local')) {
      return true;
    }

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }
    const private172 = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (private172) {
      const secondOctet = Number(private172[1]);
      return secondOctet >= 16 && secondOctet <= 31;
    }
  } catch {
    return false;
  }

  return false;
};

const buildCorsOrigin = (): CorsOptions['origin'] => {
  const allowed = parseCorsOrigin();
  if (allowed === true) {
    return true;
  }

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (Array.isArray(allowed) && allowed.includes(origin)) {
      callback(null, true);
      return;
    }

    if (env.NODE_ENV !== 'production' && isPrivateNetworkOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin ${origin}`));
  };
};

export const createApp = () => {
  const app = express();
  const corsOptions: CorsOptions = {
    origin: buildCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'X-Mobile-Api-Key',
      'X-Claudy-Client-Platform',
      'X-Claudy-Client-Version',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Request-ID', 'X-Correlation-ID'],
    maxAge: 86400,
  };

  // Trust proxy (important for X-Forwarded-For in production)
  app.set('trust proxy', 1);

  // Response compression (gzip/brotli)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(compression() as any);

  // Disable server signature
  app.disable('x-powered-by');

  // Security headers
  app.use(helmet());
  app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
  });

  // CORS
  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));

  // Request tracking - MUST be before other middleware
  app.use(requestTrackingMiddleware);

  // Logging
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Body parsing
  app.use(express.json({ limit: '3mb' }));

  // Rate limiting
  app.use(apiLimiter);

  // Health check (no auth needed)
  app.use('/', healthRouter);

  // Public legal pages (no auth needed) — required for App Store/Play Store submission.
  app.use('/', legalRouter);

  // Auth routes (have their own rate limiting)
  app.use('/v1/auth', authRouter);

  // OAuth sign-in (Google + Apple)
  app.use('/v1/auth/oauth', oauthRouter);

  // MFA / TOTP management
  app.use('/v1/auth/mfa', mfaRouter);

  // Biometric registration + verification
  app.use('/v1/auth/biometric', biometricRouter);

  // Account security dashboard
  app.use('/v1/me/security', accountSecurityRouter);

  // Protected routes
  app.use('/v1/me', meRouter);
  app.use('/v1/live', liveRouter);
  app.use('/v1/content', contentRouter);
  app.use('/v1/analytics', analyticsRouter);
  app.use('/v1/engagement', engagementRouter);
  app.use('/v1/mobile', mobileRouter);
  app.use('/v1/mobile/app', mobileAppConfigRouter);
  app.use('/v1/mobile/word-of-day', mobileWordOfDayRouter);
  app.use('/v1/admin', adminRouter);
  app.use('/v1/admin/storage', adminStorageRouter);
  app.use('/v1/admin/ads', adminAdsRouter);
  app.use('/v1/admin/ai', adminAiRouter);
  app.use('/v1/admin/app-config', adminAppConfigRouter);
  app.use('/v1/admin/word-of-day', adminWordOfDayRouter);
  app.use('/v1/youtube', youtubeRouter);
  app.use('/v1/search', searchRouter);
  app.use('/v1/me/devices', devicesRouter);

  // Prometheus metrics (protected by token in production)
  app.get('/metrics', async (req: Request, res: Response) => {
    const token = env.METRICS_TOKEN;
    if (token) {
      const auth = req.header('authorization');
      if (auth !== `Bearer ${token}`) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }
    const output = await getMetricsOutput();
    res.setHeader('Content-Type', metricsContentType);
    res.status(200).send(output);
  });

  // Error handlers (MUST be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

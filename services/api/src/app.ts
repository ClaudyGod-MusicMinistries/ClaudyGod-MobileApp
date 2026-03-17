import cors from 'cors';
import type { CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { adminAppConfigRouter, mobileAppConfigRouter } from './modules/appConfig/appConfig.routes';
import { authRouter } from './modules/auth/auth.routes';
import { contentRouter } from './modules/content/content.routes';
import { healthRouter } from './modules/health/health.routes';
import { meRouter } from './modules/me/me.routes';
import { mobileRouter } from './modules/mobile/mobile.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';
import { youtubeRouter } from './modules/youtube/youtube.routes';
import { adminWordOfDayRouter, mobileWordOfDayRouter } from './modules/wordOfDay/wordOfDay.routes';

const parseCorsOrigin = (): true | string[] => {
  const origins = env.CORS_ORIGINS;

  if (origins.length === 0 || origins.includes('*')) {
    return true;
  }

  return origins;
};

const isPrivateNetworkOrigin = (origin: string): boolean => {
  try {
    const { hostname } = new URL(origin);
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
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

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: buildCorsOrigin(),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '3mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use('/', healthRouter);
  app.use('/v1/auth', authRouter);
  app.use('/v1/me', meRouter);
  app.use('/v1/content', contentRouter);
  app.use('/v1/analytics', analyticsRouter);
  app.use('/v1/uploads', uploadsRouter);
  app.use('/v1/mobile', mobileRouter);
  app.use('/v1/mobile/app', mobileAppConfigRouter);
  app.use('/v1/mobile/word-of-day', mobileWordOfDayRouter);
  app.use('/v1/admin', adminRouter);
  app.use('/v1/admin/app-config', adminAppConfigRouter);
  app.use('/v1/admin/word-of-day', adminWordOfDayRouter);
  app.use('/v1/youtube', youtubeRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

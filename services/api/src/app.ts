import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { adminAppConfigRouter, mobileAppConfigRouter } from './modules/appConfig/appConfig.routes';
import { authRouter } from './modules/auth/auth.routes';
import { contentRouter } from './modules/content/content.routes';
import { healthRouter } from './modules/health/health.routes';
import { meRouter } from './modules/me/me.routes';
import { mobileRouter } from './modules/mobile/mobile.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';
import { youtubeRouter } from './modules/youtube/youtube.routes';

const parseCorsOrigin = (): boolean | string[] => {
  const origins = env.CORS_ORIGINS;

  if (origins.length === 0 || origins.includes('*')) {
    return true;
  }

  return origins;
};

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: parseCorsOrigin(),
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
  app.use('/v1/admin/app-config', adminAppConfigRouter);
  app.use('/v1/youtube', youtubeRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

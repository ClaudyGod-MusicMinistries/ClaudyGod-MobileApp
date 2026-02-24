import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authRouter } from './modules/auth/auth.routes';
import { contentRouter } from './modules/content/content.routes';
import { healthRouter } from './modules/health/health.routes';

const parseCorsOrigin = (): boolean | string[] => {
  const origins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

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
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use('/', healthRouter);
  app.use('/v1/auth', authRouter);
  app.use('/v1/content', contentRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

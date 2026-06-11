import { initTelemetry } from './lib/telemetry';
import { createApp } from './app';
import { env } from './config/env';
import { closePool } from './db/pool';
import { initWsServer } from './infra/websocket';
import { closeRedis } from './infra/redis';
import { createLogger } from './lib/logger';
import { waitForInfrastructure } from './lib/waitForInfrastructure';
import { contentQueue } from './queues/contentQueue';
import { emailQueue } from './queues/emailQueue';
import { statsQueue } from './queues/statsQueue';
import { trendingQueue } from './queues/trendingQueue';

const log = createLogger('api');

const boot = async (): Promise<void> => {
  const bootStart = Date.now();
  await initTelemetry();
  log.info('Starting API server', { env: env.NODE_ENV, port: env.API_PORT, host: env.API_HOST });

  await waitForInfrastructure('api');

  const app = createApp();
  const server = app.listen(env.API_PORT, env.API_HOST, () => {
    log.info('API server ready', {
      url: `http://${env.API_HOST}:${env.API_PORT}`,
      bootMs: Date.now() - bootStart,
    });
  });

  initWsServer(server);

  const shutdown = async (signal: string): Promise<void> => {
    log.info('Shutdown initiated', { signal });

    server.close(async () => {
      log.info('HTTP server closed — draining queues and connections');
      await Promise.allSettled([
        contentQueue.close(),
        emailQueue.close(),
        statsQueue.close(),
        trendingQueue.close(),
        closeRedis(),
        closePool(),
      ]);
      log.info('Shutdown complete');
      process.exit(0);
    });

    // Force-kill if graceful shutdown stalls beyond 10 seconds.
    setTimeout(() => {
      log.error('Shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => { void shutdown('SIGINT'); });
  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
};

boot().catch(async (error) => {
  log.error('Fatal startup error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
  await Promise.allSettled([contentQueue.close(), emailQueue.close(), statsQueue.close(), trendingQueue.close(), closeRedis(), closePool()]);
  process.exit(1);
});

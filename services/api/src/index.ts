import { initSentry } from './lib/sentry';

// Initialized before any other import that might throw during module load, so
// Sentry can capture even the earliest startup failures.
initSentry();

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
import { broadcastViewerCount } from './modules/live/live.websocket';

const LIVE_CHANNEL_PREFIX = 'live:';

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

  initWsServer(server, (channel, count) => {
    if (!channel.startsWith(LIVE_CHANNEL_PREFIX)) return;
    const sessionId = channel.slice(LIVE_CHANNEL_PREFIX.length);
    broadcastViewerCount(sessionId, count);
  });

  let shutdownStarted = false;
  const shutdown = async (signal: string, error?: unknown): Promise<void> => {
    if (shutdownStarted) return;
    shutdownStarted = true;

    if (error) {
      log.error('API shutdown triggered by unhandled error', {
        signal,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } else {
      log.info('Shutdown initiated', { signal });
    }

    server.close(async () => {
      log.info('HTTP server closed — draining queues and connections');
      const results = await Promise.allSettled([
        contentQueue.close(),
        emailQueue.close(),
        statsQueue.close(),
        trendingQueue.close(),
        closeRedis(),
        closePool(),
      ]);
      for (const result of results) {
        if (result.status === 'rejected') {
          log.error('Shutdown step failed', { reason: result.reason instanceof Error ? result.reason.message : String(result.reason) });
        }
      }
      log.info('Shutdown complete');
      process.exit(error ? 1 : 0);
    });

    // Force-kill if graceful shutdown stalls beyond 10 seconds.
    const killTimer = setTimeout(() => {
      log.error('Shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000);
    (killTimer as unknown as NodeJS.Timeout).unref();
  };

  process.on('SIGINT', () => { void shutdown('SIGINT'); });
  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('uncaughtException', (err) => { void shutdown('uncaughtException', err); });
  process.on('unhandledRejection', (reason) => { void shutdown('unhandledRejection', reason); });
};

boot().catch(async (error) => {
  log.error('Fatal startup error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
  await Promise.allSettled([contentQueue.close(), emailQueue.close(), statsQueue.close(), trendingQueue.close(), closeRedis(), closePool()]);
  process.exit(1);
});

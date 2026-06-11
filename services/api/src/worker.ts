import { env } from './config/env';
import { closePool } from './db/pool';
import { emailTransportInfo, verifyEmailTransport } from './infra/email';
import { closeRedis } from './infra/redis';
import { createLogger } from './lib/logger';
import { waitForInfrastructure } from './lib/waitForInfrastructure';
import { startContentWorker } from './queues/contentWorker';
import { startEmailWorker } from './queues/emailWorker';
import { startStatsWorker } from './queues/statsWorker';
import { startTrendingWorker } from './queues/trendingWorker';
import { scheduleTrendingJobs } from './queues/trendingQueue';

const log = createLogger('worker');

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const waitForEmailTransport = async (
  opts?: { maxAttempts?: number; delayMs?: number },
): Promise<void> => {
  if (!emailTransportInfo.enabled) {
    log.warn('SMTP transport is disabled — email jobs will not reach external inboxes');
    return;
  }

  const maxAttempts = opts?.maxAttempts ?? 12;
  const delayMs = opts?.delayMs ?? 2000;
  let lastReason = 'Unknown SMTP verification error';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const verification = await verifyEmailTransport();

    if (verification.reachable) {
      if (attempt > 1) {
        log.info('SMTP transport ready', { attempt, maxAttempts });
      }
      return;
    }

    lastReason = verification.reason ?? lastReason;
    log.warn('SMTP transport not ready', { attempt, maxAttempts, reason: lastReason });

    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }

  throw new Error(`SMTP transport not ready after ${maxAttempts} attempts: ${lastReason}`);
};

const bootWorker = async (): Promise<void> => {
  const bootStart = Date.now();
  log.info('Starting workers', { env: env.NODE_ENV });

  await waitForInfrastructure('worker');
  await waitForEmailTransport();

  const contentWorker = startContentWorker();
  const emailWorker = startEmailWorker();
  const statsWorker = startStatsWorker();
  const trendingWorker = startTrendingWorker();

  await scheduleTrendingJobs();

  log.info('Workers ready', { workers: ['content', 'email', 'stats', 'trending'], bootMs: Date.now() - bootStart });

  const shutdown = async (signal: string, error?: unknown): Promise<void> => {
    if (error) {
      log.error('Worker shutdown triggered by unhandled error', {
        signal,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } else {
      log.info('Worker shutdown initiated', { signal });
    }

    await Promise.allSettled([contentWorker.close(), emailWorker.close(), statsWorker.close(), trendingWorker.close()]);
    await Promise.allSettled([closeRedis(), closePool()]);
    log.info('Worker shutdown complete');
    process.exit(error ? 1 : 0);
  };

  process.on('SIGINT', () => { void shutdown('SIGINT'); });
  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('uncaughtException', (err) => { void shutdown('uncaughtException', err); });
  process.on('unhandledRejection', (reason) => { void shutdown('unhandledRejection', reason); });
};

bootWorker().catch(async (error) => {
  log.error('Fatal worker startup error', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  await Promise.allSettled([closeRedis(), closePool()]);
  process.exit(1);
});

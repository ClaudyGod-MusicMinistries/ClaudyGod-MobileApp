import { rmSync, writeFileSync } from 'node:fs';
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
import { reconcilePendingContentJobs } from './queues/contentOutbox';
import { reconcilePendingEmailJobs } from './queues/emailOutbox';
import { reconcileExpiredAdminUploads } from './modules/admin/storage.service';
import { startMediaWorker } from './queues/mediaWorker';
import { reconcilePendingMediaJobs } from './queues/mediaOutbox';

const log = createLogger('worker');
const WORKER_READY_FILE = '/tmp/claudygod-worker-ready.json';

const clearWorkerReadiness = (): void => {
  rmSync(WORKER_READY_FILE, { force: true });
};

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
  clearWorkerReadiness();
  const bootStart = Date.now();
  log.info('Starting workers', { env: env.NODE_ENV });

  await waitForInfrastructure('worker');
  await waitForEmailTransport();

  const contentWorker = startContentWorker();
  const emailWorker = startEmailWorker();
  const statsWorker = startStatsWorker();
  const trendingWorker = startTrendingWorker();
  const mediaWorker = startMediaWorker();

  await scheduleTrendingJobs();
  await reconcilePendingContentJobs();
  await reconcilePendingEmailJobs();
  await reconcileExpiredAdminUploads();
  await reconcilePendingMediaJobs();
  writeFileSync(WORKER_READY_FILE, JSON.stringify({ pid: process.pid, readyAt: new Date().toISOString() }));
  const outboxTimer = setInterval(() => {
    void reconcilePendingContentJobs().catch((error) => {
      log.error('Content outbox reconciliation failed', { error: error instanceof Error ? error.message : String(error) });
    });
  }, 30_000);
  const uploadReconciliationTimer = setInterval(() => {
    void reconcileExpiredAdminUploads().catch((error) => {
      log.error('Expired upload reconciliation failed', { error: error instanceof Error ? error.message : String(error) });
    });
  }, 5 * 60_000);
  const emailOutboxTimer = setInterval(() => {
    void reconcilePendingEmailJobs().catch((error) => {
      log.error('Email outbox reconciliation failed', { error: error instanceof Error ? error.message : String(error) });
    });
  }, 30_000);
  const mediaOutboxTimer = setInterval(() => {
    void reconcilePendingMediaJobs().catch((error) => log.error('Media outbox reconciliation failed', { error: String(error) }));
  }, 30_000);

  log.info('Workers ready', { workers: ['content', 'email', 'stats', 'trending', 'media-security'], bootMs: Date.now() - bootStart });

  const shutdown = async (signal: string, error?: unknown): Promise<void> => {
    clearWorkerReadiness();
    clearInterval(outboxTimer);
    clearInterval(uploadReconciliationTimer);
    clearInterval(emailOutboxTimer);
    clearInterval(mediaOutboxTimer);
    if (error) {
      log.error('Worker shutdown triggered by unhandled error', {
        signal,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } else {
      log.info('Worker shutdown initiated', { signal });
    }

    const workerResults = await Promise.allSettled([contentWorker.close(), emailWorker.close(), statsWorker.close(), trendingWorker.close(), mediaWorker.close()]);
    const infraResults = await Promise.allSettled([closeRedis(), closePool()]);
    for (const result of [...workerResults, ...infraResults]) {
      if (result.status === 'rejected') {
        log.error('Shutdown step failed', { reason: result.reason instanceof Error ? result.reason.message : String(result.reason) });
      }
    }
    log.info('Worker shutdown complete');
    process.exit(error ? 1 : 0);
  };

  process.on('SIGINT', () => { void shutdown('SIGINT'); });
  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('uncaughtException', (err) => { void shutdown('uncaughtException', err); });
  process.on('unhandledRejection', (reason) => { void shutdown('unhandledRejection', reason); });
};

bootWorker().catch(async (error) => {
  clearWorkerReadiness();
  log.error('Fatal worker startup error', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  await Promise.allSettled([closeRedis(), closePool()]);
  process.exit(1);
});

import { env } from './config/env';
import { closePool, pool } from './db/pool';
import { emailTransportInfo, verifyEmailTransport } from './infra/email';
import { closeRedis, redis } from './infra/redis';
import { waitForInfrastructure } from './lib/waitForInfrastructure';
import { startContentWorker } from './queues/contentWorker';
import { startEmailWorker } from './queues/emailWorker';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const waitForEmailTransport = async (
  label: string,
  opts?: { maxAttempts?: number; delayMs?: number },
): Promise<void> => {
  if (!emailTransportInfo.enabled) {
    console.warn(`${label}: SMTP transport is disabled; email jobs will not reach external inboxes`);
    return;
  }

  const maxAttempts = opts?.maxAttempts ?? 12;
  const delayMs = opts?.delayMs ?? 2000;
  let lastReason = 'Unknown SMTP verification error';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const verification = await verifyEmailTransport();

    if (verification.reachable) {
      if (attempt > 1) {
        console.log(`${label}: SMTP transport became ready on attempt ${attempt}/${maxAttempts}`);
      }
      return;
    }

    lastReason = verification.reason ?? lastReason;
    console.warn(`${label}: SMTP transport not ready (${attempt}/${maxAttempts}) - ${lastReason}`);

    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }

  throw new Error(`SMTP transport not ready: ${lastReason}`);
};

const bootWorker = async (): Promise<void> => {
  await waitForInfrastructure('worker');
  await waitForEmailTransport('worker');

  const contentWorker = startContentWorker();
  const emailWorker = startEmailWorker();
  console.log(`Workers started (content + email, env=${env.NODE_ENV})`);

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, shutting down worker...`);
    await Promise.allSettled([contentWorker.close(), emailWorker.close()]);
    await Promise.allSettled([closeRedis(), closePool()]);
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
};

bootWorker().catch(async (error) => {
  console.error('Fatal worker startup error:', error);
  await Promise.allSettled([closeRedis(), closePool()]);
  process.exit(1);
});

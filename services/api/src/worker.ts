import { env } from './config/env';
import { closePool, pool } from './db/pool';
import { closeRedis, redis } from './infra/redis';
import { waitForInfrastructure } from './lib/waitForInfrastructure';
import { startContentWorker } from './queues/contentWorker';

const bootWorker = async (): Promise<void> => {
  await waitForInfrastructure('worker');

  const worker = startContentWorker();
  console.log(`Content worker started (env=${env.NODE_ENV})`);

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, shutting down worker...`);
    await worker.close();
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

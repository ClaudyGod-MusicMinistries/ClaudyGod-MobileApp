import { env } from './config/env';
import { runMigrations } from './db/migrate';
import { closePool, pool } from './db/pool';
import { closeRedis, redis } from './infra/redis';
import { startContentWorker } from './queues/contentWorker';

const bootWorker = async (): Promise<void> => {
  await runMigrations();
  await pool.query('SELECT 1');
  await redis.ping();

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

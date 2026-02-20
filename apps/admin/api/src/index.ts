import { createApp } from './app';
import { env } from './config/env';
import { runMigrations } from './db/migrate';
import { closePool, pool } from './db/pool';
import { closeRedis, redis } from './infra/redis';
import { contentQueue } from './queues/contentQueue';

const boot = async (): Promise<void> => {
  await runMigrations();
  await pool.query('SELECT 1');
  await redis.ping();

  const app = createApp();
  const server = app.listen(env.API_PORT, env.API_HOST, () => {
    console.log(`Admin API listening on http://${env.API_HOST}:${env.API_PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, shutting down API server...`);

    server.close(async () => {
      await Promise.allSettled([contentQueue.close(), closeRedis(), closePool()]);
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
};

boot().catch(async (error) => {
  console.error('Fatal API startup error:', error);
  await Promise.allSettled([contentQueue.close(), closeRedis(), closePool()]);
  process.exit(1);
});

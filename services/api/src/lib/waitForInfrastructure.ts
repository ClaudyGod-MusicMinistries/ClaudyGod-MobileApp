import { runMigrations } from '../db/migrate';
import { pool } from '../db/pool';
import { redis } from '../infra/redis';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isFatalDatabaseConfigurationError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = (error as Error & { code?: string }).code;
  const message = error.message.toLowerCase();

  return (
    code === '28P01' ||
    code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
    (code === 'XX000' && message.includes('authentication')) ||
    message.includes('password authentication failed') ||
    message.includes('self-signed certificate in certificate chain')
  );
};

export const waitForInfrastructure = async (
  label: string,
  opts?: { maxAttempts?: number; delayMs?: number },
): Promise<void> => {
  const maxAttempts = opts?.maxAttempts ?? 20;
  const delayMs = opts?.delayMs ?? 2000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await runMigrations();
      await pool.query('SELECT 1');
      await redis.ping();
      if (attempt > 1) {
        console.log(`${label}: infrastructure became ready on attempt ${attempt}/${maxAttempts}`);
      }
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `${label}: infrastructure not ready (${attempt}/${maxAttempts}) - ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );

      if (isFatalDatabaseConfigurationError(error)) {
        throw error;
      }

      if (attempt < maxAttempts) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
};

import { Pool } from 'pg';
import { env } from '../config/env';

const useSsl = env.DATABASE_SSL || /supabase\./i.test(env.DATABASE_URL);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export const closePool = async (): Promise<void> => {
  await pool.end();
};

import dns from 'node:dns';
import { Pool } from 'pg';
import { env } from '../config/env';

// Prefer IPv4 first so Supabase hosts still work on servers without IPv6 routing.
dns.setDefaultResultOrder('ipv4first');

const useSsl = env.DATABASE_SSL || /supabase\./i.test(env.DATABASE_URL);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export const closePool = async (): Promise<void> => {
  await pool.end();
};

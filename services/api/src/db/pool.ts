import dns from 'node:dns';
import { Pool } from 'pg';
import { env } from '../config/env';

// Prefer IPv4 first so Supabase hosts still work on servers without IPv6 routing.
dns.setDefaultResultOrder('ipv4first');

const normalizeConnectionString = (value: string): string => {
  try {
    const parsed = new URL(value);

    // Let node-postgres use the explicit ssl option below instead of
    // inheriting sslmode semantics from the connection string.
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('sslcert');
    parsed.searchParams.delete('sslkey');
    parsed.searchParams.delete('sslrootcert');

    return parsed.toString();
  } catch {
    return value;
  }
};

const useSsl = env.DATABASE_SSL || /supabase\./i.test(env.DATABASE_URL);

export const pool = new Pool({
  connectionString: normalizeConnectionString(env.DATABASE_URL),
  max: 20,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export const closePool = async (): Promise<void> => {
  await pool.end();
};

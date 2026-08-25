import dns from 'node:dns';
import { Pool } from 'pg';
import { databaseEnv } from '../config/databaseEnv';

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

const useSsl = databaseEnv.DATABASE_SSL || /supabase\./i.test(databaseEnv.DATABASE_URL);

const decodeDatabaseCa = (): string | undefined => {
  if (!databaseEnv.DATABASE_SSL_CA_BASE64) return undefined;
  const decoded = Buffer.from(databaseEnv.DATABASE_SSL_CA_BASE64, 'base64').toString('utf8').trim();
  if (!/^-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----$/.test(decoded)) {
    throw new Error('DATABASE_SSL_CA_BASE64 must decode to a PEM certificate chain.');
  }
  return decoded;
};

const databaseCa = decodeDatabaseCa();

export const pool = new Pool({
  connectionString: normalizeConnectionString(databaseEnv.DATABASE_URL),
  max: 20,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  ssl: useSsl
    ? {
        rejectUnauthorized: databaseEnv.DATABASE_SSL_REJECT_UNAUTHORIZED,
        ...(databaseCa ? { ca: databaseCa } : {}),
      }
    : undefined,
});

export const closePool = async (): Promise<void> => {
  await pool.end();
};

import { env } from '../config/env';
import { pool } from '../db/pool';
import { verifyEmailTransport } from '../infra/email';
import { redis } from '../infra/redis';
import { checkBucketAccess } from '../infra/s3';
import { supabaseAdmin } from '../infra/supabase';

type CheckStatus = 'passed' | 'failed';

interface CheckResult {
  name: string;
  status: CheckStatus;
  durationMs: number;
  detail: string;
}

const timeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let handle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        handle = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
      }),
    ]);
  } finally {
    if (handle) clearTimeout(handle);
  }
};

const safeError = (error: unknown): string => {
  if (!(error instanceof Error)) return 'Unknown integration failure';
  // Do not print URLs, tokens, provider payloads, or connection strings from
  // dependency errors into deployment logs.
  if (/timed out/i.test(error.message)) return error.message;
  return `${error.name || 'Error'}: integration request failed`;
};

async function runCheck(name: string, operation: () => Promise<string>): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    const detail = await operation();
    return { name, status: 'passed', durationMs: Date.now() - startedAt, detail };
  } catch (error) {
    return {
      name,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      detail: safeError(error),
    };
  }
}

async function checkDatabase(): Promise<string> {
  const result = await timeout(
    pool.query<{ migration_count: string }>(
      `SELECT COUNT(*)::text AS migration_count FROM schema_migrations`,
    ),
    5_000,
    'PostgreSQL certification',
  );
  return `PostgreSQL accepted credentials; ${result.rows[0]?.migration_count ?? '0'} migrations recorded`;
}

async function checkRedis(): Promise<string> {
  const response = await timeout(redis.ping(), 3_000, 'Redis certification');
  if (response !== 'PONG') throw new Error('Unexpected Redis response');
  return 'Redis accepted credentials and responded to PING';
}

async function checkStorage(): Promise<string> {
  if (!env.S3_ENABLED) throw new Error('Storage is not configured');
  await timeout(checkBucketAccess(env.SUPABASE_STORAGE_BUCKET), 8_000, 'Storage certification');
  return `Storage credentials can access bucket ${env.SUPABASE_STORAGE_BUCKET}`;
}

async function checkSupabaseAdmin(): Promise<string> {
  if (!env.SUPABASE_ENABLED || !supabaseAdmin) throw new Error('Supabase Admin is not configured');
  const { error } = await timeout(
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
    8_000,
    'Supabase Admin certification',
  );
  if (error) throw new Error('Supabase Admin rejected credentials');
  return 'Supabase Admin accepted the service-role credential';
}

async function checkSmtp(): Promise<string> {
  if (!env.SMTP_ENABLED) throw new Error('SMTP is not configured');
  const result = await timeout(verifyEmailTransport(), 8_000, 'SMTP certification');
  if (!result.reachable) throw new Error('SMTP transport is unreachable');
  return `${env.SMTP_PROVIDER_LABEL} accepted the transport connection`;
}

async function checkYouTube(): Promise<string> {
  if (!env.YOUTUBE_ENABLED) throw new Error('YouTube is not configured');
  const channel = env.YOUTUBE_CHANNEL_ID.trim();
  const query = new URLSearchParams({ key: env.YOUTUBE_API_KEY, part: 'id' });
  if (channel.startsWith('@')) query.set('forHandle', channel.slice(1));
  else query.set('id', channel);

  const response = await timeout(
    fetch(`https://www.googleapis.com/youtube/v3/channels?${query.toString()}`),
    8_000,
    'YouTube certification',
  );
  const payload = (await response.json()) as { items?: unknown[]; error?: unknown };
  if (!response.ok || payload.error || !payload.items?.length) {
    throw new Error('YouTube rejected the API key or channel identifier');
  }
  return 'YouTube API key and configured channel were verified';
}

async function checkWebsiteBackend(): Promise<string> {
  if (!env.CGM_ENABLED) throw new Error('Website backend is not configured');
  const url = new URL('/health/ready', env.CGM_API_BASE_URL);
  const response = await timeout(
    fetch(url, { headers: { Accept: 'application/json', 'x-api-key': env.CGM_API_KEY } }),
    8_000,
    'Website backend certification',
  );
  if (!response.ok) throw new Error('Website backend readiness check failed');
  return 'Website backend is reachable and ready';
}

async function main(): Promise<void> {
  const checks = await Promise.all([
    runCheck('postgres', checkDatabase),
    runCheck('redis', checkRedis),
    runCheck('storage', checkStorage),
    runCheck('supabase-admin', checkSupabaseAdmin),
    runCheck('smtp', checkSmtp),
    runCheck('youtube', checkYouTube),
    runCheck('website-backend', checkWebsiteBackend),
  ]);

  const passed = checks.every((check) => check.status === 'passed');
  process.stdout.write(`${JSON.stringify({
    status: passed ? 'certified' : 'failed',
    environment: env.NODE_ENV,
    checkedAt: new Date().toISOString(),
    checks,
  }, null, 2)}\n`);
  process.exitCode = passed ? 0 : 1;
}

void main().finally(async () => {
  await Promise.allSettled([pool.end(), redis.quit()]);
});

import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { closePool, pool } from './pool';
import { createLogger } from '../lib/logger';

const log = createLogger('db.migrate');

const migrationStatements = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  `CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone TEXT`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS country TEXT`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en'`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS timezone TEXT`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`,
  `ALTER TABLE app_users ALTER COLUMN password_hash DROP NOT NULL`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'local'
    CHECK (auth_provider IN ('local', 'supabase'))`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS supabase_user_id UUID`,
  `CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('audio', 'video', 'playlist', 'announcement')),
    media_url TEXT,
    visibility TEXT NOT NULL DEFAULT 'draft' CHECK (visibility IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS source_kind TEXT NOT NULL DEFAULT 'upload' CHECK (source_kind IN ('upload', 'youtube', 'external'))`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS external_source_id TEXT`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS channel_name TEXT`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS duration_label TEXT`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS app_sections TEXT[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS search_vector TSVECTOR`,
  `CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    channel_id TEXT NOT NULL DEFAULT 'claudygod-live',
    cover_image_url TEXT,
    stream_url TEXT,
    playback_url TEXT,
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    notify_subscribers BOOLEAN NOT NULL DEFAULT TRUE,
    viewer_count INTEGER NOT NULL DEFAULT 0 CHECK (viewer_count >= 0),
    tags TEXT[] NOT NULL DEFAULT '{}',
    app_sections TEXT[] NOT NULL DEFAULT '{live-now}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    recording_content_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS search_vector TSVECTOR`,
  `CREATE OR REPLACE FUNCTION content_items_search_vector_update() RETURNS TRIGGER AS $$
  BEGIN
    NEW.search_vector := 
      setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.channel_name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql`,
  `DROP TRIGGER IF EXISTS content_items_search_vector_update ON content_items`,
  `CREATE TRIGGER content_items_search_vector_update
    BEFORE INSERT OR UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION content_items_search_vector_update()`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_search_vector ON content_items USING GIN (search_vector)`,
  `CREATE OR REPLACE FUNCTION live_sessions_search_vector_update() RETURNS TRIGGER AS $$
  BEGIN
    NEW.search_vector := 
      setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.channel_id, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql`,
  `DROP TRIGGER IF EXISTS live_sessions_search_vector_update ON live_sessions`,
  `CREATE TRIGGER live_sessions_search_vector_update
    BEFORE INSERT OR UPDATE ON live_sessions
    FOR EACH ROW EXECUTE FUNCTION live_sessions_search_vector_update()`,
  `CREATE INDEX IF NOT EXISTS idx_live_sessions_search_vector ON live_sessions USING GIN (search_vector)`,
];

const MIGRATION_LOCK_ID = 7246130001;
const MIGRATION_LEDGER_TABLE = 'schema_migrations';

const summarizeStatement = (statement: string): string => {
  const normalized = statement.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(CREATE|ALTER|DROP)\s+(TABLE|INDEX|EXTENSION|FUNCTION|TRIGGER|UNIQUE INDEX)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?("?[\w.:-]+"?)/i) ??
    normalized.match(/^DO\s+\$\$/i);
  if (!match) {
    return normalized.slice(0, 64);
  }
  if (match[0].toUpperCase().startsWith('DO $$')) {
    return 'trigger-maintenance-block';
  }
  return `${match[1].toLowerCase()}-${match[2].toLowerCase().replace(/\s+/g, '-')}-${match[3].replace(/"/g, '')}`;
};

const migrations = migrationStatements.map((statement, index) => ({
  id: String(index + 1).padStart(4, '0'),
  name: summarizeStatement(statement),
  statement,
  checksum: createHash('sha256').update(statement).digest('hex'),
}));

const ensureMigrationLedger = async (client: PoolClient): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_LEDGER_TABLE} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
    await ensureMigrationLedger(client);

    const appliedResult = await client.query(`SELECT id, checksum FROM ${MIGRATION_LEDGER_TABLE}`);
    const applied = new Map(appliedResult.rows.map((row: { id: string; checksum: string }) => [row.id, row.checksum]));

    let appliedCount = 0;
    for (const migration of migrations) {
      const existingChecksum = applied.get(migration.id);
      if (existingChecksum) {
        if (existingChecksum !== migration.checksum) {
          throw new Error(
            `Migration checksum mismatch for ${migration.id} (${migration.name}). Refusing to continue because an applied migration changed.`
          );
        }
        continue;
      }

      await client.query('BEGIN');
      transactionOpen = true;
      await client.query(migration.statement);
      await client.query(
        `INSERT INTO ${MIGRATION_LEDGER_TABLE} (id, name, checksum) VALUES ($1, $2, $3)`,
        [migration.id, migration.name, migration.checksum]
      );
      await client.query('COMMIT');
      transactionOpen = false;
      appliedCount += 1;
    }

    log.info(`Database migrations completed. ${appliedCount} applied, ${migrations.length - appliedCount} already current.`);
  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK').catch(() => undefined);
    }
    throw error;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]).catch(() => undefined);
    client.release();
  }
};

const run = async (): Promise<void> => {
  try {
    await runMigrations();
    await closePool();
    log.info('Database migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    await closePool();
    const err = error as Error & { code?: string; severity?: string; detail?: string; hint?: string; where?: string };
    log.error('Database migrations failed', {
      error: {
        message: err?.message ?? String(error),
        stack: err?.stack,
        code: err?.code,
        severity: err?.severity,
        detail: err?.detail,
        hint: err?.hint,
        where: err?.where,
      },
    });
    process.exit(1);
  }
};

if (require.main === module) {
  void run();
}

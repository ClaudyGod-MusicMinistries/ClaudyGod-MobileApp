import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { closePool, pool } from './pool';
import { createLogger } from '../lib/logger';

const log = createLogger('db.migrate');

const migrationStatements = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  
  // ============ APP USERS ============
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

  // ============ USER PROFILES ============
  `CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    country TEXT,
    locale TEXT NOT NULL DEFAULT 'en',
    timezone TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ============ USER PREFERENCES ============
  `CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    autoplay_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    high_quality_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    diagnostics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    personalization_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    theme_preference TEXT NOT NULL DEFAULT 'dark' CHECK (theme_preference IN ('system', 'light', 'dark')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ============ CONTENT ITEMS ============
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

  // ============ LIVE SESSIONS ============
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

  // ============ USER SEARCH EVENTS ============
  `CREATE TABLE IF NOT EXISTS user_search_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    clicked_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_search_events_user_searched_at ON user_search_events (user_id, searched_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_user_search_events_searched_at_query ON user_search_events (searched_at DESC, query)`,
  `CREATE INDEX IF NOT EXISTS idx_user_search_events_query_lower_searched_at ON user_search_events (LOWER(query), searched_at DESC)`,

  // ============ WORD FOR TODAY ==========
  `CREATE TABLE IF NOT EXISTS word_of_day_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    passage TEXT NOT NULL,
    verse_text TEXT NOT NULL,
    reflection_text TEXT NOT NULL,
    teaching_text TEXT,
    application_text TEXT,
    prayer_text TEXT,
    message_date DATE NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    notify_email BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    notified_at TIMESTAMPTZ,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE word_of_day_entries ADD COLUMN IF NOT EXISTS teaching_text TEXT`,
  `ALTER TABLE word_of_day_entries ADD COLUMN IF NOT EXISTS application_text TEXT`,
  `ALTER TABLE word_of_day_entries ADD COLUMN IF NOT EXISTS prayer_text TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_word_of_day_publish_schedule ON word_of_day_entries (status, message_date DESC)`,

  // ============ USER PUSH TOKENS ============
  `CREATE TABLE IF NOT EXISTS user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    expo_push_token TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'unknown',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, expo_push_token)
  )`,

  // ============ USER SAVED ITEMS ============
  `CREATE TABLE IF NOT EXISTS user_saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    bucket TEXT NOT NULL CHECK (bucket IN ('liked', 'downloaded', 'playlist')),
    playlist_name TEXT,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    media_url TEXT,
    duration TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ============ USER PLAY EVENTS ============
  `CREATE TABLE IF NOT EXISTS user_play_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_title TEXT NOT NULL,
    source_screen TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE user_play_events
     ADD COLUMN IF NOT EXISTS duration_ms    INTEGER,
     ADD COLUMN IF NOT EXISTS position_ms    INTEGER     DEFAULT 0,
     ADD COLUMN IF NOT EXISTS skip_count     SMALLINT    DEFAULT 0,
     ADD COLUMN IF NOT EXISTS source         TEXT        DEFAULT 'direct'
       CHECK (source IN ('feed','search','recommendation','direct','playlist','autoplay')),
     ADD COLUMN IF NOT EXISTS session_id     UUID`,

  // ============ CONTENT SEARCH VECTOR ============
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

  // ============ LIVE SESSIONS SEARCH VECTOR ============
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

  // ============ SUPPORT REQUESTS (ACCOUNT + GUEST INSTALLATIONS) ============
  `CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE support_requests ALTER COLUMN user_id DROP NOT NULL`,
  `ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`,
  `CREATE INDEX IF NOT EXISTS idx_support_requests_user_created_at ON support_requests (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_support_requests_guest_device ON support_requests ((metadata->>'deviceId'), created_at DESC) WHERE user_id IS NULL`,

  // ============ PRODUCT RATINGS (ACCOUNT + GUEST INSTALLATIONS) ============
  `CREATE TABLE IF NOT EXISTS app_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    channel TEXT NOT NULL DEFAULT 'mobile' CHECK (channel IN ('mobile', 'admin', 'web')),
    comment TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE app_ratings ALTER COLUMN user_id DROP NOT NULL`,
  `ALTER TABLE app_ratings ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`,
  `CREATE INDEX IF NOT EXISTS idx_app_ratings_created_at ON app_ratings (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_app_ratings_guest_device ON app_ratings ((metadata->>'deviceId'), created_at DESC) WHERE user_id IS NULL`,

  // ============ INSTALLATION REFERRALS ============
  `CREATE TABLE IF NOT EXISTS mobile_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_device_id UUID UNIQUE,
    token_hash TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
    app_version TEXT,
    personalization_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS idx_mobile_installations_last_seen ON mobile_installations (last_seen_at DESC)`,
  `ALTER TABLE mobile_installations ADD COLUMN IF NOT EXISTS personalization_enabled BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE mobile_installations ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE`,
  `CREATE TABLE IF NOT EXISTS mobile_installation_push_tokens (
    installation_id UUID NOT NULL REFERENCES mobile_installations(id) ON DELETE CASCADE,
    expo_push_token TEXT NOT NULL UNIQUE,
    device_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (installation_id, expo_push_token)
  )`,
  `CREATE TABLE IF NOT EXISTS mobile_installation_live_subscriptions (
    installation_id UUID NOT NULL REFERENCES mobile_installations(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (installation_id, channel_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_mobile_installation_live_channel ON mobile_installation_live_subscriptions (channel_id)`,
  `CREATE TABLE IF NOT EXISTS mobile_installation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL REFERENCES mobile_installations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('onboarding_completed', 'playback_milestone')),
    content_id TEXT,
    content_type TEXT,
    source TEXT,
    idempotency_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (installation_id, idempotency_key)
  )`,
  `ALTER TABLE mobile_installation_events ADD COLUMN IF NOT EXISTS content_id TEXT`,
  `ALTER TABLE mobile_installation_events ADD COLUMN IF NOT EXISTS content_type TEXT`,
  `ALTER TABLE mobile_installation_events ADD COLUMN IF NOT EXISTS source TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_mobile_installation_events_content ON mobile_installation_events (installation_id, created_at DESC) WHERE content_id IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS mobile_installation_history (
    installation_id UUID NOT NULL REFERENCES mobile_installations(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('audio', 'video', 'playlist', 'announcement', 'live')),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    duration TEXT,
    image_url TEXT,
    media_url TEXT,
    source TEXT,
    play_count INTEGER NOT NULL DEFAULT 1 CHECK (play_count > 0),
    first_played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (installation_id, content_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_mobile_installation_history_recent ON mobile_installation_history (installation_id, last_played_at DESC)`,
  `CREATE TABLE IF NOT EXISTS mobile_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE CHECK (code ~ '^CG[A-F0-9]{8}$'),
    share_count INTEGER NOT NULL DEFAULT 0 CHECK (share_count >= 0),
    joined_count INTEGER NOT NULL DEFAULT 0 CHECK (joined_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mobile_referrals_code ON mobile_referrals (code)`,
  `CREATE TABLE IF NOT EXISTS mobile_referral_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES mobile_referrals(id) ON DELETE CASCADE,
    joined_device_id UUID NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'attributed' CHECK (status IN ('attributed', 'activated', 'rejected')),
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE mobile_referral_attributions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'attributed'`,
  `ALTER TABLE mobile_referral_attributions ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS idx_mobile_referral_attributions_referral ON mobile_referral_attributions (referral_id, created_at DESC)`,
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

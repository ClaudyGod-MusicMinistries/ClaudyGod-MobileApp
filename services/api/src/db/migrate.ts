import { pool } from './pool';

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
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
  `CREATE TABLE IF NOT EXISTS content_jobs (
    id BIGSERIAL PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    queue_job_id TEXT,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payload JSONB NOT NULL,
    error TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS email_jobs (
    id BIGSERIAL PRIMARY KEY,
    queue_job_id TEXT,
    job_type TEXT NOT NULL,
    recipients TEXT[] NOT NULL DEFAULT '{}',
    subject TEXT NOT NULL,
    text_body TEXT NOT NULL,
    html_body TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS auth_action_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    token_type TEXT NOT NULL CHECK (token_type IN ('email_verification', 'password_reset')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    requested_ip TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL CHECK (channel IN ('admin', 'mobile')),
    requested_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    client_reference TEXT,
    original_file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_bucket TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'uploaded', 'expired', 'failed')),
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
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
  `CREATE TABLE IF NOT EXISTS live_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, channel_id)
  )`,
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
  `CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'processing', 'completed', 'rejected')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS app_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    channel TEXT NOT NULL DEFAULT 'mobile' CHECK (channel IN ('mobile', 'admin', 'web')),
    comment TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS donation_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    mode TEXT NOT NULL CHECK (mode IN ('once', 'monthly')),
    method_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS app_config_store (
    config_key TEXT PRIMARY KEY,
    config_value JSONB NOT NULL,
    updated_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS word_of_day_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Word for Today',
    passage TEXT NOT NULL,
    verse_text TEXT NOT NULL,
    reflection_text TEXT NOT NULL,
    message_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    notify_email BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    notified_at TIMESTAMPTZ,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (message_date)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_visibility_created_at
    ON content_items (visibility, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_author_created_at
    ON content_items (author_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_app_sections_gin
    ON content_items USING GIN (app_sections)`,
  `CREATE INDEX IF NOT EXISTS idx_content_jobs_status_created_at
    ON content_jobs (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_email_jobs_status_created_at
    ON email_jobs (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_action_tokens_user_type_created_at
    ON auth_action_tokens (user_id, token_type, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_action_tokens_token_type_expires_at
    ON auth_action_tokens (token_type, expires_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_upload_sessions_channel_status_created_at
    ON upload_sessions (channel, status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_user_play_events_user_played_at
    ON user_play_events (user_id, played_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_user_play_events_content_played_at
    ON user_play_events (content_id, played_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_live_subscriptions_user_created_at
    ON live_subscriptions (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_user_saved_items_user_bucket_created_at
    ON user_saved_items (user_id, bucket, created_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_saved_items_unique_bucket
    ON user_saved_items (user_id, bucket, content_id, COALESCE(playlist_name, ''))`,
  `CREATE INDEX IF NOT EXISTS idx_privacy_requests_user_created_at
    ON privacy_requests (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_support_requests_status_created_at
    ON support_requests (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_app_ratings_created_at
    ON app_ratings (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_donation_intents_status_created_at
    ON donation_intents (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_word_of_day_message_date
    ON word_of_day_entries (message_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_word_of_day_status_message_date
    ON word_of_day_entries (status, message_date DESC)`,
  `CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`,
  `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_app_users_updated_at') THEN
        CREATE TRIGGER set_app_users_updated_at
        BEFORE UPDATE ON app_users
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_content_items_updated_at') THEN
        CREATE TRIGGER set_content_items_updated_at
        BEFORE UPDATE ON content_items
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_content_jobs_updated_at') THEN
        CREATE TRIGGER set_content_jobs_updated_at
        BEFORE UPDATE ON content_jobs
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_email_jobs_updated_at') THEN
        CREATE TRIGGER set_email_jobs_updated_at
        BEFORE UPDATE ON email_jobs
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_auth_action_tokens_updated_at') THEN
        CREATE TRIGGER set_auth_action_tokens_updated_at
        BEFORE UPDATE ON auth_action_tokens
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_upload_sessions_updated_at') THEN
        CREATE TRIGGER set_upload_sessions_updated_at
        BEFORE UPDATE ON upload_sessions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_profiles_updated_at') THEN
        CREATE TRIGGER set_user_profiles_updated_at
        BEFORE UPDATE ON user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_preferences_updated_at') THEN
        CREATE TRIGGER set_user_preferences_updated_at
        BEFORE UPDATE ON user_preferences
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_live_subscriptions_updated_at') THEN
        CREATE TRIGGER set_live_subscriptions_updated_at
        BEFORE UPDATE ON live_subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_saved_items_updated_at') THEN
        CREATE TRIGGER set_user_saved_items_updated_at
        BEFORE UPDATE ON user_saved_items
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_privacy_requests_updated_at') THEN
        CREATE TRIGGER set_privacy_requests_updated_at
        BEFORE UPDATE ON privacy_requests
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_support_requests_updated_at') THEN
        CREATE TRIGGER set_support_requests_updated_at
        BEFORE UPDATE ON support_requests
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_donation_intents_updated_at') THEN
        CREATE TRIGGER set_donation_intents_updated_at
        BEFORE UPDATE ON donation_intents
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_app_config_store_updated_at') THEN
        CREATE TRIGGER set_app_config_store_updated_at
        BEFORE UPDATE ON app_config_store
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_word_of_day_entries_updated_at') THEN
        CREATE TRIGGER set_word_of_day_entries_updated_at
        BEFORE UPDATE ON word_of_day_entries
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$`,
];

export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const statement of migrations) {
      await client.query(statement);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

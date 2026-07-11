import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { closePool, pool } from './pool';
import { createLogger } from '../lib/logger';

const log = createLogger('db.migrate');

const migrationStatements = [
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
    provider TEXT NOT NULL DEFAULT 'generic',
    template_key TEXT,
    job_type TEXT NOT NULL,
    recipients TEXT[] NOT NULL DEFAULT '{}',
    subject TEXT NOT NULL,
    text_body TEXT NOT NULL,
    html_body TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error TEXT,
    sent_message_id TEXT,
    last_attempt_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE email_jobs ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'generic'`,
  `ALTER TABLE email_jobs ADD COLUMN IF NOT EXISTS template_key TEXT`,
  `ALTER TABLE email_jobs ADD COLUMN IF NOT EXISTS sent_message_id TEXT`,
  `ALTER TABLE email_jobs ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ`,
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
  `CREATE TABLE IF NOT EXISTS pending_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'ADMIN')),
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    requested_ip TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS pending_password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    requested_ip TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS auth_activity_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    email TEXT,
    event_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'info' CHECK (status IN ('success', 'failure', 'info')),
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS auth_refresh_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    session_family_id UUID NOT NULL,
    rotated_from_session_id UUID REFERENCES auth_refresh_sessions(id) ON DELETE SET NULL,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_ip TEXT,
    created_user_agent TEXT,
    last_used_ip TEXT,
    last_used_user_agent TEXT,
    last_used_at TIMESTAMPTZ,
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
  `CREATE TABLE IF NOT EXISTS content_submission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('audio', 'video', 'playlist', 'announcement')),
    media_url TEXT,
    thumbnail_url TEXT,
    source_kind TEXT NOT NULL DEFAULT 'upload' CHECK (source_kind IN ('upload', 'youtube', 'external')),
    external_source_id TEXT,
    channel_name TEXT,
    duration_label TEXT,
    app_sections TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_notes TEXT,
    requested_visibility TEXT NOT NULL DEFAULT 'draft' CHECK (requested_visibility IN ('draft', 'published')),
    request_status TEXT NOT NULL DEFAULT 'submitted' CHECK (request_status IN ('submitted', 'in_review', 'changes_requested', 'approved', 'fulfilled', 'rejected')),
    media_upload_session_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL,
    thumbnail_upload_session_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL,
    created_content_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS media_upload_session_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS thumbnail_upload_session_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL`,
  `CREATE TABLE IF NOT EXISTS automation_runs (
    id BIGSERIAL PRIMARY KEY,
    run_type TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'admin',
    actor_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
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
  `CREATE TABLE IF NOT EXISTS user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    expo_push_token TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'unknown',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, expo_push_token)
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
  `CREATE TABLE IF NOT EXISTS live_session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'comment' CHECK (kind IN ('comment', 'suggestion')),
    status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    mode TEXT NOT NULL CHECK (mode IN ('once', 'daily', 'weekly', 'monthly')),
    method_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE donation_intents DROP CONSTRAINT IF EXISTS donation_intents_mode_check`,
  `ALTER TABLE donation_intents ADD CONSTRAINT donation_intents_mode_check CHECK (mode IN ('once', 'daily', 'weekly', 'monthly'))`,
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
  `CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    placement TEXT NOT NULL CHECK (placement IN ('landing', 'home', 'videos', 'player', 'live', 'library', 'search')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    sponsor_name TEXT NOT NULL,
    headline TEXT NOT NULL,
    body_text TEXT NOT NULL,
    cta_label TEXT NOT NULL,
    cta_url TEXT NOT NULL,
    image_url TEXT,
    audience_tags TEXT[] NOT NULL DEFAULT '{}',
    daily_budget_cents INTEGER NOT NULL DEFAULT 0 CHECK (daily_budget_cents >= 0),
    weight INTEGER NOT NULL DEFAULT 100 CHECK (weight >= 1 AND weight <= 1000),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS ai_generation_runs (
    id BIGSERIAL PRIMARY KEY,
    feature_key TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('heuristic', 'remote')),
    actor_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_visibility_created_at
    ON content_items (visibility, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_author_created_at
    ON content_items (author_id, created_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_supabase_user_id
    ON app_users (supabase_user_id)
    WHERE supabase_user_id IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_app_sections_gin
    ON content_items USING GIN (app_sections)`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_media_upload_session_id
    ON content_items (media_upload_session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_thumbnail_upload_session_id
    ON content_items (thumbnail_upload_session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_automation_runs_type_created_at
    ON automation_runs (run_type, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_automation_runs_status_created_at
    ON automation_runs (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_jobs_status_created_at
    ON content_jobs (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_email_jobs_status_created_at
    ON email_jobs (status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status_placement_dates
    ON ad_campaigns (status, placement, starts_at, ends_at, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_generation_runs_feature_created_at
    ON ai_generation_runs (feature_key, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_action_tokens_user_type_created_at
    ON auth_action_tokens (user_id, token_type, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_action_tokens_token_type_expires_at
    ON auth_action_tokens (token_type, expires_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_pending_signups_email_created_at
    ON pending_signups (email, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_pending_signups_expires_at
    ON pending_signups (expires_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_pending_password_resets_email_created_at
    ON pending_password_resets (email, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_pending_password_resets_expires_at
    ON pending_password_resets (expires_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_activity_events_event_created_at
    ON auth_activity_events (event_key, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_activity_events_user_created_at
    ON auth_activity_events (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_user_expires_at
    ON auth_refresh_sessions (user_id, expires_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_family_active
    ON auth_refresh_sessions (session_family_id, revoked_at, expires_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_upload_sessions_channel_status_created_at
    ON upload_sessions (channel, status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_submission_requests_status_created_at
    ON content_submission_requests (request_status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_submission_requests_requester_created_at
    ON content_submission_requests (requester_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_user_play_events_user_played_at
    ON user_play_events (user_id, played_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_user_play_events_content_played_at
    ON user_play_events (content_id, played_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_live_subscriptions_user_created_at
    ON live_subscriptions (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_live_sessions_status_schedule
    ON live_sessions (status, COALESCE(started_at, scheduled_for, created_at) DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_live_sessions_channel_status
    ON live_sessions (channel_id, status, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_live_session_messages_session_created_at
    ON live_session_messages (live_session_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_user_saved_items_user_bucket_created_at
    ON user_saved_items (user_id, bucket, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_updated_at
    ON user_push_tokens (user_id, updated_at DESC)`,
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

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_pending_signups_updated_at') THEN
        CREATE TRIGGER set_pending_signups_updated_at
        BEFORE UPDATE ON pending_signups
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_pending_password_resets_updated_at') THEN
        CREATE TRIGGER set_pending_password_resets_updated_at
        BEFORE UPDATE ON pending_password_resets
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_auth_refresh_sessions_updated_at') THEN
        CREATE TRIGGER set_auth_refresh_sessions_updated_at
        BEFORE UPDATE ON auth_refresh_sessions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_upload_sessions_updated_at') THEN
        CREATE TRIGGER set_upload_sessions_updated_at
        BEFORE UPDATE ON upload_sessions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_content_submission_requests_updated_at') THEN
        CREATE TRIGGER set_content_submission_requests_updated_at
        BEFORE UPDATE ON content_submission_requests
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_automation_runs_updated_at') THEN
        CREATE TRIGGER set_automation_runs_updated_at
        BEFORE UPDATE ON automation_runs
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

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_push_tokens_updated_at') THEN
        CREATE TRIGGER set_user_push_tokens_updated_at
        BEFORE UPDATE ON user_push_tokens
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_live_subscriptions_updated_at') THEN
        CREATE TRIGGER set_live_subscriptions_updated_at
        BEFORE UPDATE ON live_subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_live_sessions_updated_at') THEN
        CREATE TRIGGER set_live_sessions_updated_at
        BEFORE UPDATE ON live_sessions
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_live_session_messages_updated_at') THEN
        CREATE TRIGGER set_live_session_messages_updated_at
        BEFORE UPDATE ON live_session_messages
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
  `CREATE TABLE IF NOT EXISTS account_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('email_change')),
    token_hash TEXT NOT NULL UNIQUE,
    current_email TEXT NOT NULL,
    new_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    requested_ip TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_account_change_requests_user_status_created_at
    ON account_change_requests (user_id, status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_account_change_requests_token_hash
    ON account_change_requests (token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_account_change_requests_expires_at
    ON account_change_requests (expires_at DESC)`,
  `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_account_change_requests_updated_at') THEN
        CREATE TRIGGER set_account_change_requests_updated_at
        BEFORE UPDATE ON account_change_requests
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$`,

  /* ── Phase 3: Enhanced play events ──────────────────────────────────────── */
  `ALTER TABLE user_play_events
     ADD COLUMN IF NOT EXISTS duration_ms    INTEGER,
     ADD COLUMN IF NOT EXISTS position_ms    INTEGER     DEFAULT 0,
     ADD COLUMN IF NOT EXISTS skip_count     SMALLINT    DEFAULT 0,
     ADD COLUMN IF NOT EXISTS source         TEXT        DEFAULT 'direct'
       CHECK (source IN ('feed','search','recommendation','direct','playlist','autoplay')),
     ADD COLUMN IF NOT EXISTS session_id     UUID`,

  `CREATE TABLE IF NOT EXISTS content_item_stats (
     content_id       UUID         PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE,
     play_count       BIGINT       NOT NULL DEFAULT 0,
     unique_listeners BIGINT       NOT NULL DEFAULT 0,
     like_count       BIGINT       NOT NULL DEFAULT 0,
     share_count      BIGINT       NOT NULL DEFAULT 0,
     skip_rate        NUMERIC(5,4) NOT NULL DEFAULT 0,
     avg_completion   NUMERIC(5,2) NOT NULL DEFAULT 0,
     trending_score   NUMERIC(12,4) NOT NULL DEFAULT 0,
     last_played_at   TIMESTAMPTZ,
     updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_content_item_stats_trending_score
     ON content_item_stats (trending_score DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_item_stats_play_count
     ON content_item_stats (play_count DESC)`,

  `CREATE TABLE IF NOT EXISTS user_playback_sessions (
     id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id        UUID         NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
     content_id     UUID         NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
     device_id      UUID,
     started_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
     last_heartbeat TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
     ended_at       TIMESTAMPTZ,
     position_ms    INTEGER      NOT NULL DEFAULT 0,
     duration_ms    INTEGER,
     source         TEXT         DEFAULT 'direct',
     created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_user_playback_sessions_user_active
     ON user_playback_sessions (user_id, ended_at)
     WHERE ended_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_user_playback_sessions_content_started
     ON user_playback_sessions (content_id, started_at DESC)`,

  /* ── Phase 4: Trending snapshots ────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS trending_snapshots (
     id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
     content_id    UUID         NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
     period        TEXT         NOT NULL CHECK (period IN ('hourly','daily','weekly')),
     score         NUMERIC(12,4) NOT NULL DEFAULT 0,
     rank          INTEGER,
     calculated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
     UNIQUE (content_id, period, calculated_at)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_trending_snapshots_period_score
     ON trending_snapshots (period, score DESC, calculated_at DESC)`,

  /* ── Phase 5: Full-text search ───────────────────────────────────────────── */
  /* search_vector is maintained by trigger — Supabase rejects to_tsvector     */
  /* inside GENERATED ALWAYS AS even with explicit ::regconfig cast.            */
  `ALTER TABLE content_items
     ADD COLUMN IF NOT EXISTS search_vector tsvector`,
  `CREATE OR REPLACE FUNCTION set_content_items_search_vector()
     RETURNS trigger AS $$
     BEGIN
       NEW.search_vector :=
         setweight(to_tsvector('english'::regconfig, coalesce(NEW.title, '')), 'A') ||
         setweight(to_tsvector('english'::regconfig, coalesce(NEW.description, '')), 'B') ||
         setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql`,
  `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_content_items_search_vector') THEN
         CREATE TRIGGER trg_content_items_search_vector
         BEFORE INSERT OR UPDATE OF title, description, tags ON content_items
         FOR EACH ROW EXECUTE FUNCTION set_content_items_search_vector();
       END IF;
     END $$`,
  `UPDATE content_items
     SET search_vector =
       setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
       setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'B') ||
       setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(tags, ' '), '')), 'C')
     WHERE search_vector IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_search_vector
     ON content_items USING GIN (search_vector)`,

  `CREATE TABLE IF NOT EXISTS user_search_events (
     id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id       UUID         REFERENCES app_users(id) ON DELETE SET NULL,
     query         TEXT         NOT NULL,
     results_count INTEGER      NOT NULL DEFAULT 0,
     clicked_id    UUID         REFERENCES content_items(id) ON DELETE SET NULL,
     searched_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_user_search_events_user_searched_at
     ON user_search_events (user_id, searched_at DESC)`,

  /* ── Phase 6: User devices ───────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS user_devices (
     id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id            UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
     device_fingerprint TEXT        NOT NULL,
     device_name        TEXT,
     device_type        TEXT        NOT NULL DEFAULT 'mobile'
       CHECK (device_type IN ('mobile','tablet','tv','web','desktop')),
     platform           TEXT,
     app_version        TEXT,
     push_token         TEXT,
     is_trusted         BOOLEAN     NOT NULL DEFAULT false,
     last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     registered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     revoked_at         TIMESTAMPTZ,
     UNIQUE (user_id, device_fingerprint)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_user_devices_user_active
     ON user_devices (user_id)
     WHERE revoked_at IS NULL`,

  /* ── RBAC: Expand role constraint + add tier + mfa_enabled ──────────────── */
  `ALTER TABLE app_users
     ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
       CHECK (tier IN ('free','premium','vip'))`,
  `ALTER TABLE app_users
     ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check`,
  `ALTER TABLE app_users ADD CONSTRAINT app_users_role_check
     CHECK (role IN ('CLIENT','CREATOR','MODERATOR','ADMIN','SUPER_ADMIN'))`,

  /* ── MFA: TOTP factors + backup codes ───────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS user_mfa_factors (
     id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id      UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
     factor_type  TEXT        NOT NULL DEFAULT 'totp' CHECK (factor_type IN ('totp')),
     secret       TEXT        NOT NULL,
     is_verified  BOOLEAN     NOT NULL DEFAULT FALSE,
     is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (user_id, factor_type)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_user_mfa_factors_user_active
     ON user_mfa_factors (user_id) WHERE is_active = TRUE`,

  `CREATE TABLE IF NOT EXISTS user_backup_codes (
     id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id     UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
     code_hash   TEXT        NOT NULL,
     used_at     TIMESTAMPTZ,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_user_backup_codes_user_unused
     ON user_backup_codes (user_id) WHERE used_at IS NULL`,

  /* ── OAuth identities ───────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS user_oauth_identities (
     id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id          UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
     provider         TEXT        NOT NULL CHECK (provider IN ('google','apple')),
     provider_user_id TEXT        NOT NULL,
     email            TEXT,
     avatar_url       TEXT,
     last_used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (provider, provider_user_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_user_oauth_identities_user
     ON user_oauth_identities (user_id)`,

  /* ── Biometric credentials + challenges ─────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS user_biometric_credentials (
     id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id      UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
     device_id    TEXT        NOT NULL,
     public_key   TEXT        NOT NULL,
     key_hash     TEXT        NOT NULL,
     algorithm    TEXT        NOT NULL DEFAULT 'EC',
     device_label TEXT,
     last_used_at TIMESTAMPTZ,
     revoked_at   TIMESTAMPTZ,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (user_id, device_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_user_biometric_credentials_user_active
     ON user_biometric_credentials (user_id) WHERE revoked_at IS NULL`,

  `CREATE TABLE IF NOT EXISTS biometric_challenges (
     id         TEXT        PRIMARY KEY,
     user_id    UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
     device_id  TEXT        NOT NULL,
     challenge  TEXT        NOT NULL,
     expires_at TIMESTAMPTZ NOT NULL,
     used_at    TIMESTAMPTZ,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_biometric_challenges_user_device
     ON biometric_challenges (user_id, device_id)`,
  `CREATE INDEX IF NOT EXISTS idx_biometric_challenges_expires_at
     ON biometric_challenges (expires_at)`,

  /* ── Account security: lockout + audit log ──────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS user_account_security (
     user_id                UUID        PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
     failed_login_attempts  INTEGER     NOT NULL DEFAULT 0,
     locked_until           TIMESTAMPTZ,
     last_failed_at         TIMESTAMPTZ,
     last_password_change_at TIMESTAMPTZ,
     updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  `CREATE TABLE IF NOT EXISTS security_audit_log (
     id          BIGSERIAL   PRIMARY KEY,
     user_id     UUID        REFERENCES app_users(id) ON DELETE SET NULL,
     event       TEXT        NOT NULL,
     ip_address  TEXT,
     user_agent  TEXT,
     metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_created
     ON security_audit_log (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_created
     ON security_audit_log (event, created_at DESC)`,

  /* ── auth_sessions (canonical active-session store for OAuth/biometric) ─── */
  `CREATE TABLE IF NOT EXISTS auth_sessions (
     id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id            UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
     session_id         TEXT        NOT NULL UNIQUE,
     session_family_id  TEXT        NOT NULL,
     refresh_token_hash TEXT        NOT NULL,
     ip_address         TEXT,
     user_agent         TEXT,
     expires_at         TIMESTAMPTZ NOT NULL,
     revoked_at         TIMESTAMPTZ,
     created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active
     ON auth_sessions (user_id, expires_at)
     WHERE revoked_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_auth_sessions_session_id
     ON auth_sessions (session_id)`,

  /* ── Admin invitations (invite-only admin onboarding) ───────────────────── */
  `CREATE TABLE IF NOT EXISTS admin_invitations (
     id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     email        TEXT        NOT NULL,
     role         TEXT        NOT NULL DEFAULT 'MODERATOR'
                  CHECK (role IN ('CLIENT','CREATOR','MODERATOR','ADMIN','SUPER_ADMIN')),
     invited_by   UUID        REFERENCES app_users(id) ON DELETE SET NULL,
     token_hash   TEXT        NOT NULL UNIQUE,
     expires_at   TIMESTAMPTZ NOT NULL,
     accepted_at  TIMESTAMPTZ,
     revoked_at   TIMESTAMPTZ,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_admin_invitations_email
     ON admin_invitations (email)`,
  `CREATE INDEX IF NOT EXISTS idx_admin_invitations_token_hash
     ON admin_invitations (token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_admin_invitations_pending
     ON admin_invitations (expires_at)
     WHERE accepted_at IS NULL AND revoked_at IS NULL`,

  /* ── Admin access requests (self-service onboarding requests) ────────────── */
  `CREATE TABLE IF NOT EXISTS admin_access_requests (
     id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     name         TEXT        NOT NULL,
     email        TEXT        NOT NULL,
     role         TEXT        NOT NULL DEFAULT 'MODERATOR'
                  CHECK (role IN ('CREATOR','MODERATOR','ADMIN')),
     message      TEXT,
     status       TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
     reviewed_by  UUID        REFERENCES app_users(id) ON DELETE SET NULL,
     reviewed_at  TIMESTAMPTZ,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_admin_access_requests_status
     ON admin_access_requests (status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_admin_access_requests_email
     ON admin_access_requests (email)`,

  /* ── Email OTP codes (passwordless / magic-code sign-in) ────────────────── */
  `CREATE TABLE IF NOT EXISTS email_otps (
     id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     email        TEXT        NOT NULL,
     code_hash    TEXT        NOT NULL,
     purpose      TEXT        NOT NULL DEFAULT 'sign_in'
                  CHECK (purpose IN ('sign_in', 'sign_up')),
     expires_at   TIMESTAMPTZ NOT NULL,
     used_at      TIMESTAMPTZ,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_email_otps_email_purpose
     ON email_otps (email, purpose)
     WHERE used_at IS NULL`,

  /* ── Trusted device tokens (long-lived, gate on biometric at client) ─────── */
  `CREATE TABLE IF NOT EXISTS trusted_device_tokens (
     id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id         UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
     device_id       UUID        REFERENCES user_devices(id) ON DELETE CASCADE,
     token_hash      TEXT        NOT NULL UNIQUE,
     device_label    TEXT,
     expires_at      TIMESTAMPTZ NOT NULL,
     last_used_at    TIMESTAMPTZ,
     revoked_at      TIMESTAMPTZ,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_trusted_device_tokens_user
     ON trusted_device_tokens (user_id)
     WHERE revoked_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_trusted_device_tokens_hash
     ON trusted_device_tokens (token_hash)`,

  /* ── Auth action tokens: allow MFA step-up tokens (login already issues these) ─ */
  `ALTER TABLE auth_action_tokens DROP CONSTRAINT IF EXISTS auth_action_tokens_token_type_check`,
  `ALTER TABLE auth_action_tokens ADD CONSTRAINT auth_action_tokens_token_type_check
     CHECK (token_type IN ('email_verification', 'password_reset', 'mfa_step_up'))`,

  /* ── Content items: admin-controlled manual ordering ──────────────────────── */
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS sort_order INTEGER`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_sort_order ON content_items (sort_order)`,

  /* ── Content items: soft-delete (trash/restore) ────────────────────────────── */
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_deleted_at ON content_items (deleted_at)`,
];

const MIGRATION_LOCK_ID = 7_246_130_001;
const MIGRATION_LEDGER_TABLE = 'schema_migrations';

type MigrationStep = {
  id: string;
  name: string;
  statement: string;
  checksum: string;
};

const summarizeStatement = (statement: string): string => {
  const normalized = statement.replace(/\s+/g, ' ').trim();
  const match =
    normalized.match(/^(CREATE|ALTER|DROP)\s+(TABLE|INDEX|EXTENSION|FUNCTION|TRIGGER|UNIQUE INDEX)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?("?[\w.:-]+"?)/i) ??
    normalized.match(/^DO\s+\$\$/i);

  if (!match) {
    return normalized.slice(0, 64);
  }

  if (match[0].toUpperCase().startsWith('DO $$')) {
    return 'trigger-maintenance-block';
  }

  return `${match[1].toLowerCase()}-${match[2].toLowerCase().replace(/\s+/g, '-')}-${match[3].replace(/"/g, '')}`;
};

const migrations: MigrationStep[] = migrationStatements.map((statement, index) => ({
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

    const appliedResult = await client.query<{ id: string; checksum: string }>(
      `SELECT id, checksum FROM ${MIGRATION_LEDGER_TABLE}`,
    );
    const applied = new Map(appliedResult.rows.map((row) => [row.id, row.checksum]));
    let appliedCount = 0;

    for (const migration of migrations) {
      const existingChecksum = applied.get(migration.id);

      if (existingChecksum) {
        if (existingChecksum !== migration.checksum) {
          throw new Error(
            `Migration checksum mismatch for ${migration.id} (${migration.name}). Refusing to continue because an applied migration changed.`,
          );
        }
        continue;
      }

      await client.query('BEGIN');
      transactionOpen = true;
      await client.query(migration.statement);
      await client.query(
        `INSERT INTO ${MIGRATION_LEDGER_TABLE} (id, name, checksum) VALUES ($1, $2, $3)`,
        [migration.id, migration.name, migration.checksum],
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
    const e = error as Record<string, unknown>;
    log.error('Database migrations failed', {
      error: {
        message: e?.message ?? String(error),
        stack:   e?.stack,
        code:    e?.code,
        severity: e?.severity,
        detail:  e?.detail,
        hint:    e?.hint,
        where:   e?.where,
      },
    });
    process.exit(1);
  }
};

if (require.main === module) {
  void run();
}

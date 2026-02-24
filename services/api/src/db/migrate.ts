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
  `CREATE INDEX IF NOT EXISTS idx_content_items_visibility_created_at
    ON content_items (visibility, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_items_author_created_at
    ON content_items (author_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_content_jobs_status_created_at
    ON content_jobs (status, created_at DESC)`,
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

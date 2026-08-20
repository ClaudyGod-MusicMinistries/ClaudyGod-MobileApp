#!/usr/bin/env bash
set -euo pipefail

for command_name in pg_restore age sha256sum psql; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "Required command missing: $command_name" >&2; exit 1; }
done

: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required}"
: "${BACKUP_AGE_IDENTITY_FILE:?BACKUP_AGE_IDENTITY_FILE is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"

if [ "${ALLOW_RESTORE_VERIFICATION:-false}" != "true" ]; then
  echo "Refusing restore: set ALLOW_RESTORE_VERIFICATION=true after confirming the target is isolated and disposable." >&2
  exit 1
fi
if [ -n "${DATABASE_URL:-}" ] && [ "$RESTORE_DATABASE_URL" = "$DATABASE_URL" ]; then
  echo "Refusing restore: RESTORE_DATABASE_URL matches DATABASE_URL." >&2
  exit 1
fi
if [ ! -f "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE.sha256" ]; then
  echo "Encrypted backup or checksum sidecar is missing." >&2
  exit 1
fi

sha256sum --check "$BACKUP_FILE.sha256"
EXISTING_TABLES="$(psql "$RESTORE_DATABASE_URL" -XAtqc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'")"
if [ "$EXISTING_TABLES" != "0" ]; then
  echo "Refusing restore: target database is not empty ($EXISTING_TABLES public tables)." >&2
  exit 1
fi

RESTORE_TEMP_DIRECTORY="$(mktemp -d "${TMPDIR:-/tmp}/claudygod-restore.XXXXXX")"
trap 'rm -rf "$RESTORE_TEMP_DIRECTORY"' EXIT
PLAIN_DUMP="$RESTORE_TEMP_DIRECTORY/restore.dump"
age --decrypt --identity "$BACKUP_AGE_IDENTITY_FILE" --output "$PLAIN_DUMP" "$BACKUP_FILE"
pg_restore --dbname="$RESTORE_DATABASE_URL" --exit-on-error --no-owner --no-privileges "$PLAIN_DUMP"

psql "$RESTORE_DATABASE_URL" -X --set ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(required.name, ', ') INTO missing
  FROM (VALUES ('app_users'), ('content_items'), ('upload_sessions'), ('content_jobs'),
               ('email_jobs'), ('media_processing_jobs'), ('security_audit_log')) required(name)
  WHERE to_regclass('public.' || required.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Restore missing required tables: %', missing; END IF;
END $$;
SELECT 'restore_verified' AS status, NOW() AT TIME ZONE 'UTC' AS verified_at;
SQL

echo "Restore verification passed against the isolated target."

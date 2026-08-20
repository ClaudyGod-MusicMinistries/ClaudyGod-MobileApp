#!/usr/bin/env bash
set -euo pipefail

for command_name in pg_dump age sha256sum; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "Required command missing: $command_name" >&2; exit 1; }
done

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_AGE_RECIPIENT:?BACKUP_AGE_RECIPIENT is required}"

BACKUP_OUTPUT_DIRECTORY="${BACKUP_DIRECTORY:-./backups}"
BACKUP_TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_BASENAME="claudygod-${BACKUP_TIMESTAMP}.dump"
BACKUP_TEMP_DIRECTORY="$(mktemp -d "${TMPDIR:-/tmp}/claudygod-backup.XXXXXX")"
trap 'rm -rf "$BACKUP_TEMP_DIRECTORY"' EXIT

mkdir -p "$BACKUP_OUTPUT_DIRECTORY"
chmod 700 "$BACKUP_OUTPUT_DIRECTORY"

PLAIN_DUMP="$BACKUP_TEMP_DIRECTORY/$BACKUP_BASENAME"
ENCRYPTED_BACKUP="$BACKUP_OUTPUT_DIRECTORY/$BACKUP_BASENAME.age"
CHECKSUM_FILE="$ENCRYPTED_BACKUP.sha256"

pg_dump --dbname="$DATABASE_URL" --format=custom --compress=9 --no-owner --no-privileges --file="$PLAIN_DUMP"
age --recipient "$BACKUP_AGE_RECIPIENT" --output "$ENCRYPTED_BACKUP" "$PLAIN_DUMP"
chmod 600 "$ENCRYPTED_BACKUP"
sha256sum "$ENCRYPTED_BACKUP" > "$CHECKSUM_FILE"
chmod 600 "$CHECKSUM_FILE"

if [ -n "${BACKUP_S3_URI:-}" ]; then
  command -v aws >/dev/null 2>&1 || { echo "BACKUP_S3_URI is set but aws CLI is unavailable" >&2; exit 1; }
  S3_PREFIX="${BACKUP_S3_URI%/}"
  aws s3 cp "$ENCRYPTED_BACKUP" "$S3_PREFIX/$(basename "$ENCRYPTED_BACKUP")" --only-show-errors
  aws s3 cp "$CHECKSUM_FILE" "$S3_PREFIX/$(basename "$CHECKSUM_FILE")" --only-show-errors
fi

echo "Encrypted backup created: $ENCRYPTED_BACKUP"
echo "Checksum: $CHECKSUM_FILE"

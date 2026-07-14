#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRODUCTION_CHECK_ENV="$(mktemp "${TMPDIR:-/tmp}/claudygod-production-compose.XXXXXX.env")"
trap 'rm -f "$PRODUCTION_CHECK_ENV"' EXIT

# Docker isn't installed on every dev machine — CI has it and will still catch
# genuine compose breakage, so skip (not block) rather than fail local pushes.
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found in PATH — skipping local compose validation (CI will still run it)."
  exit 0
fi

validate_compose() {
  local file="$1"
  local env_file="$2"
  shift || true
  shift || true

  if [ ! -f "$file" ]; then
    return 1
  fi

  echo "Validating $(realpath --relative-to="$ROOT_DIR" "$file" 2>/dev/null || echo "$file")"
  docker compose --env-file "$env_file" -f "$file" "$@" config >/dev/null
  return 0
}

cat >"$PRODUCTION_CHECK_ENV" <<'EOF'
NODE_ENV=production
CLAUDYGOD_ENV=production
DATABASE_URL=postgresql://postgres.validation:validation-password@db.validation.supabase.co:5432/postgres
DATABASE_SSL=true
REDIS_URL=redis://:validation-redis-password@redis:6379
REDIS_PASSWORD=validation-redis-password
JWT_ACCESS_SECRET=validation-access-secret-with-more-than-thirty-two-characters
JWT_REFRESH_SECRET=validation-refresh-secret-with-more-than-thirty-two-characters
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=30
CORS_ORIGIN=https://admin.validation.example,https://app.validation.example
MOBILE_API_KEY=validation-mobile-api-key
DATA_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000
METRICS_TOKEN=validation-metrics-token
AUTH_PUBLIC_BASE_URL=https://app.validation.example
AUTH_SESSION_COOKIE_NAME=claudygod_session
AUTH_REFRESH_COOKIE_NAME=claudygod_refresh_session
SUPABASE_URL=https://validation.supabase.co
SUPABASE_SERVICE_ROLE_KEY=validation-service-role-key
SUPABASE_STORAGE_BUCKET=mobile-uploads
MAIL_FROM=ClaudyGod <support@validation.example>
POSTFIX_MYHOSTNAME=mail.validation.example
POSTFIX_RELAY_HOST=smtp.validation.example
POSTFIX_RELAY_PORT=587
POSTFIX_SMTP_USERNAME=validation-smtp-user
POSTFIX_SMTP_PASSWORD=validation-smtp-password
VITE_API_URL=https://api.validation.example
VITE_MOBILE_PREVIEW_URL=https://app.validation.example
EXPO_PUBLIC_API_URL=https://api.validation.example
EXPO_PUBLIC_SUPABASE_URL=https://validation.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=validation-supabase-publishable-key
EXPO_PUBLIC_MOBILE_API_KEY=validation-mobile-api-key
API_DOMAIN=api.validation.example
ADMIN_DOMAIN=admin.validation.example
APP_DOMAIN=app.validation.example
TRAEFIK_PUBLIC_NETWORK=traefik-public
TRAEFIK_CERT_RESOLVER=letsencrypt
GRAFANA_ADMIN_PASSWORD=validation-grafana-password
EOF

# Use .env.development if it exists; fall back to .env.example for CI/hook environments.
DEV_ENV_FILE="$ROOT_DIR/.env.development"
if [ ! -f "$DEV_ENV_FILE" ]; then
  if [ -f "$ROOT_DIR/.env.example" ]; then
    DEV_ENV_FILE="$ROOT_DIR/.env.example"
    echo "Note: .env.development not found — using .env.example for compose validation."
  else
    echo ".env.development and .env.example are both missing." >&2
    exit 1
  fi
fi

validate_compose "$ROOT_DIR/docker-compose.local.yml" "$DEV_ENV_FILE"
validate_compose "$ROOT_DIR/services/api/docker-compose.dev.yml" "$DEV_ENV_FILE"

# Admin compose may live in admin/ or admin/web depending on branch structure.
if ! validate_compose "$ROOT_DIR/admin/docker-compose.dev.yml" "$DEV_ENV_FILE"; then
  if ! validate_compose "$ROOT_DIR/admin/web/docker-compose.dev.yml" "$DEV_ENV_FILE"; then
    echo "Skipping missing admin dev compose file (checked admin/ and admin/web)."
  fi
fi

validate_compose "$ROOT_DIR/apps/mobile/docker-compose.dev.yml" "$DEV_ENV_FILE" --profile web --profile native
validate_compose "$ROOT_DIR/docker-compose.production.yml" "$PRODUCTION_CHECK_ENV"

echo "Docker compose validation passed."

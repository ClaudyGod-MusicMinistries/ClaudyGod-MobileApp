#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for compose validation but was not found in PATH." >&2
  exit 1
fi

validate_compose() {
  local file="$1"
  shift || true

  if [ ! -f "$file" ]; then
    return 1
  fi

  echo "Validating $(realpath --relative-to="$ROOT_DIR" "$file" 2>/dev/null || echo "$file")"
  docker compose -f "$file" "$@" config >/dev/null
  return 0
}

validate_compose "$ROOT_DIR/docker-compose.local.yml"
validate_compose "$ROOT_DIR/services/api/docker-compose.dev.yml"

# Admin compose may live in admin/ or admin/web depending on branch structure.
if ! validate_compose "$ROOT_DIR/admin/docker-compose.dev.yml"; then
  if ! validate_compose "$ROOT_DIR/admin/web/docker-compose.dev.yml"; then
    echo "Skipping missing admin dev compose file (checked admin/ and admin/web)."
  fi
fi

validate_compose "$ROOT_DIR/apps/mobile/docker-compose.dev.yml" --profile web --profile native

echo "Docker compose validation passed."

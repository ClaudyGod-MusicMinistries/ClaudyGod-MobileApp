#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

run_step() {
  local name="$1"
  shift
  echo
  echo "==> $name"
  "$@"
}

run_step "Validate Docker compose files" bash ./scripts/docker-validate.sh
run_step "Build backend (services/api)" bash -lc 'cd ./services/api && ./node_modules/.bin/tsc'
run_step "Build admin web (admin/web)" bash -lc 'cd ./admin/web && ./node_modules/.bin/vite build'
run_step "Verify mobile package manager consistency" bash -lc 'test ! -f ./apps/mobile/package-lock.json'
run_step "Typecheck mobile app (apps/mobile)" yarn --cwd ./apps/mobile typecheck
run_step "Lint mobile app (apps/mobile)" yarn --cwd ./apps/mobile lint

echo

echo "All review checks passed. Safe to commit/push."

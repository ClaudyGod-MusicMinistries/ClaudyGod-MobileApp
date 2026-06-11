#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

unset npm_config_version_commit_hooks || true
unset npm_config_version_tag_prefix || true
unset npm_config_version_git_message || true
unset npm_config_version_git_tag || true
unset npm_config_argv || true

run_step() {
  local name="$1"
  shift
  echo
  echo "==> $name"
  "$@"
}

run_step "Validate Docker compose files"     bash ./scripts/docker-validate.sh
run_step "Typecheck API"                     yarn --cwd ./services/api typecheck
run_step "Lint API"                          yarn --cwd ./services/api lint
run_step "Build API"                         yarn --cwd ./services/api build
run_step "Build admin web"                   yarn --cwd ./admin/web build
run_step "Verify mobile uses yarn"           bash -lc 'test ! -f ./apps/mobile/package-lock.json'
run_step "Typecheck mobile"                  yarn --cwd ./apps/mobile typecheck
run_step "Lint mobile"                       yarn --cwd ./apps/mobile lint

echo
echo "All pre-push checks passed."

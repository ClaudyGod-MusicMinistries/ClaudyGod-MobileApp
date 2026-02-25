#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mapfile -t staged < <(git diff --cached --name-only --diff-filter=ACMR)

if [ "${#staged[@]}" -eq 0 ]; then
  echo "No staged files."
  exit 0
fi

has_match() {
  local pattern="$1"
  printf '%s\n' "${staged[@]}" | grep -Eq "$pattern"
}

echo "Running staged pre-commit checks..."

if has_match '^apps/mobile/.*\.(js|jsx|ts|tsx)$'; then
  bash ./scripts/precommit-mobile-staged.sh
else
  echo "No staged mobile JS/TS files to lint."
fi

if has_match '^services/api/.*\.(ts|tsx|js|json)$|^services/api/Dockerfile(\.dev)?$|^services/api/docker-compose.*\.ya?ml$'; then
  echo "Building backend (services/api) because backend files are staged..."
  npm --prefix ./services/api run build
else
  echo "No staged backend files requiring build check."
fi

if has_match '^admin/web/.*\.(js|jsx|ts|tsx|vue|json|css)$|^admin/web/Dockerfile(\.dev)?$|^admin/docker-compose.*\.ya?ml$'; then
  echo "Building admin web (admin/web) because admin files are staged..."
  npm --prefix ./admin/web run build
else
  echo "No staged admin files requiring build check."
fi

if has_match '(^|/)docker-compose.*\.ya?ml$|(^|/)Dockerfile(\..*)?$'; then
  echo "Docker files changed; validating compose configs..."
  bash ./scripts/docker-validate.sh
else
  echo "No staged Docker files to validate."
fi

echo "Staged pre-commit checks passed."

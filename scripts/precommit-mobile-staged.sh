#!/usr/bin/env bash
set -euo pipefail

# Lint only staged mobile JS/TS files so existing warnings in untouched files
# do not block commits.
# Not using `mapfile` (bash 4+ only) — macOS ships bash 3.2, which lacks it.
files=()
while IFS= read -r f; do
  [ -n "$f" ] && files+=("$f")
done < <(
  git diff --cached --name-only --diff-filter=ACMR \
    | grep -E '^apps/mobile/.*\.(js|jsx|ts|tsx)$' \
    || true
)

if [ "${#files[@]}" -eq 0 ]; then
  echo "No staged mobile JS/TS files to lint."
  exit 0
fi

for i in "${!files[@]}"; do
  files[$i]="${files[$i]#apps/mobile/}"
done

echo "Linting staged mobile files (${#files[@]})..."
yarn --cwd apps/mobile eslint --cache --fix --max-warnings=0 "${files[@]}"

# Re-stage any formatter/eslint fixes so the commit contains the validated code.
for file in "${files[@]}"; do
  git add -- "apps/mobile/$file"
done

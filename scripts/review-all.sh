#!/usr/bin/env bash
# =============================================================================
#  FULL REPO REVIEW — ClaudyGod Monorepo
#  Manual trigger: make review  OR  bash ./scripts/review-all.sh
#  Equivalent to running the pre-push gate without git context.
#  Logs to logs/git-hooks/review-YYYY-MM-DD_HH-MM-SS.log
#
#  Portable to macOS's stock bash 3.2 + BSD date on purpose: no associative
#  arrays (bash 4+ only) and no `date +%N` (GNU-only, prints a literal "N" on
#  BSD date) — timing is whole-second precision, which this gate doesn't need.
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_DIR="$ROOT_DIR/logs/git-hooks"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_FILE="$LOG_DIR/review-${TIMESTAMP}.log"

exec > >(tee -a "$LOG_FILE") 2>&1

ERRORS=0
WARNINGS=0
STEP_NUM=0
CURRENT_STEP_START=0

echo "════════════════════════════════════════════════════════════════"
echo "  ClaudyGod Full Repo Review  •  $TIMESTAMP"
echo "  Log: $LOG_FILE"
echo "════════════════════════════════════════════════════════════════"

step_start() {
  ((STEP_NUM++)) || true
  CURRENT_STEP_START=$(date +%s)
  echo ""
  echo "┌─ [Step $STEP_NUM] $1"
}

step_elapsed() {
  echo $(( $(date +%s) - CURRENT_STEP_START ))
}

run_step() {
  local name="$1"; shift
  step_start "$name"
  if "$@" 2>&1; then
    echo "└─ [PASS] $name ($(step_elapsed)s)"
  else
    echo "└─ [FAIL] $name ($(step_elapsed)s)"
    ((ERRORS++)) || true
  fi
}

warn_step() {
  local name="$1"; shift
  step_start "$name"
  if "$@" 2>&1; then
    echo "└─ [PASS] $name ($(step_elapsed)s)"
  else
    echo "└─ [WARN] $name ($(step_elapsed)s)"
    ((WARNINGS++)) || true
  fi
}

# ── API ───────────────────────────────────────────────────────────────────────
run_step  "API TypeScript — tsc --noEmit"          yarn --cwd ./services/api typecheck
run_step  "API ESLint — zero warnings"             yarn --cwd ./services/api lint
run_step  "API Build — compile to dist/"           yarn --cwd ./services/api build
run_step  "API Tests — jest"                       yarn --cwd ./services/api test

# ── Mobile ────────────────────────────────────────────────────────────────────
warn_step "Mobile TypeScript — tsc --noEmit"       yarn --cwd ./apps/mobile typecheck
warn_step "Mobile ESLint"                          yarn --cwd ./apps/mobile lint
warn_step "Mobile Tests — jest"                    yarn --cwd ./apps/mobile test

# ── Infrastructure ────────────────────────────────────────────────────────────
run_step  "Docker compose validation"              bash ./scripts/docker-validate.sh

# ── Security audit ────────────────────────────────────────────────────────────
step_start "Security audit — yarn audit (high+critical)"
if yarn --cwd ./services/api audit --level high 2>&1; then
  echo "└─ [PASS] Security audit ($(step_elapsed)s)"
else
  echo "└─ [WARN] Security audit — review findings ($(step_elapsed)s)"
  ((WARNINGS++)) || true
fi

# ── Debug statement scan ──────────────────────────────────────────────────────
step_start "console.log/debug in API src"
CONSOLE_HITS=$(grep -rn --include="*.ts" -E '^\s*console\.(log|debug|trace|dir)\s*\(' \
  services/api/src/ 2>/dev/null | grep -v '\.test\.\|\.spec\.' || true)
if [ -n "$CONSOLE_HITS" ]; then
  echo "$CONSOLE_HITS"
  echo "└─ [FAIL] Debug console statements must be replaced with logger"
  ((ERRORS++)) || true
else
  echo "└─ [PASS] No debug console statements"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  REVIEW SUMMARY"
echo "  Steps   : $STEP_NUM"
echo "  Errors  : $ERRORS"
echo "  Warnings: $WARNINGS"
echo "  Log     : $LOG_FILE"
if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "  ✗ REVIEW FAILED — $ERRORS blocking error(s)"
  echo "════════════════════════════════════════════════════════════════"
  exit 1
else
  echo ""
  echo "  ✓ REVIEW PASSED — safe to commit/push"
  echo "════════════════════════════════════════════════════════════════"
  exit 0
fi

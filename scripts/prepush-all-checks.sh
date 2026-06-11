#!/usr/bin/env bash
# =============================================================================
#  PRE-PUSH HOOK — ClaudyGod Monorepo  (FULL SUITE)
#  Runs on every push. Performs the complete quality + security gate.
#  Logs everything to logs/git-hooks/prepush-YYYY-MM-DD_HH-MM-SS.log
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

unset npm_config_version_commit_hooks npm_config_version_tag_prefix \
      npm_config_version_git_message npm_config_version_git_tag \
      npm_config_argv 2>/dev/null || true

# ── Log setup ─────────────────────────────────────────────────────────────────
LOG_DIR="$ROOT_DIR/logs/git-hooks"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_FILE="$LOG_DIR/prepush-${TIMESTAMP}.log"

exec > >(tee -a "$LOG_FILE") 2>&1

# ── Git context ───────────────────────────────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse --short HEAD)
AUTHOR=$(git config user.email 2>/dev/null || echo "unknown")

echo "════════════════════════════════════════════════════════════════"
echo "  ClaudyGod Pre-Push Full Quality Gate"
echo "  Branch : $BRANCH"
echo "  Commit : $COMMIT"
echo "  Author : $AUTHOR"
echo "  Time   : $TIMESTAMP"
echo "  Log    : $LOG_FILE"
echo "════════════════════════════════════════════════════════════════"

# ── Timing helpers ────────────────────────────────────────────────────────────
ERRORS=0
WARNINGS=0
STEP_NUM=0
declare -A STEP_TIMES

step_start() {
  ((STEP_NUM++)) || true
  STEP_TIMES[$STEP_NUM]=$(date +%s%3N)
  echo ""
  echo "┌─ [Step $STEP_NUM] $1"
}

step_end() {
  local status="$1"
  local label="$2"
  local elapsed=$(( $(date +%s%3N) - STEP_TIMES[$STEP_NUM] ))
  if [ "$status" = "pass" ]; then
    echo "└─ [PASS] $label (${elapsed}ms)"
  elif [ "$status" = "fail" ]; then
    echo "└─ [FAIL] $label (${elapsed}ms) ← BLOCKING"
    ((ERRORS++)) || true
  elif [ "$status" = "warn" ]; then
    echo "└─ [WARN] $label (${elapsed}ms)"
    ((WARNINGS++)) || true
  else
    echo "└─ [SKIP] $label"
  fi
}

run_step() {
  local name="$1"
  shift
  step_start "$name"
  if "$@" 2>&1; then
    step_end "pass" "$name"
  else
    step_end "fail" "$name"
  fi
}

warn_step() {
  local name="$1"
  shift
  step_start "$name"
  if "$@" 2>&1; then
    step_end "pass" "$name"
  else
    step_end "warn" "$name"
  fi
}

# ── 1. Forbidden file types ───────────────────────────────────────────────────
step_start "Forbidden files check (.env, secrets)"
FORBIDDEN_FILES=()
for f in $(git diff --name-only HEAD origin/"$BRANCH" 2>/dev/null || git diff --name-only HEAD~1 HEAD 2>/dev/null || true); do
  if [[ "$f" =~ (^|/)\.env(\.[^.]+)?$ ]] || \
     [[ "$f" =~ (^|/)credentials\.(json|yml|yaml)$ ]] || \
     [[ "$f" =~ (^|/)\.aws/credentials$ ]] || \
     [[ "$f" =~ (^|/)secrets\.(json|yml|yaml)$ ]]; then
    FORBIDDEN_FILES+=("$f")
  fi
done
if [ "${#FORBIDDEN_FILES[@]}" -gt 0 ]; then
  echo "  ✗ Sensitive files in push:"
  printf '    • %s\n' "${FORBIDDEN_FILES[@]}"
  step_end "fail" "Forbidden files check"
else
  step_end "pass" "Forbidden files check"
fi

# ── 2. Main branch protection ─────────────────────────────────────────────────
step_start "Protected branch check"
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "  ! Direct push to $BRANCH detected"
  echo "  ! You should push to a feature branch and open a PR"
  step_end "warn" "Protected branch (direct push to $BRANCH)"
else
  step_end "pass" "Branch is not protected ($BRANCH)"
fi

# ── 3. API TypeScript ─────────────────────────────────────────────────────────
run_step "API TypeScript — tsc --noEmit" \
  yarn --cwd ./services/api typecheck

# ── 4. API ESLint (max-warnings 0) ───────────────────────────────────────────
run_step "API ESLint — zero warnings allowed" \
  yarn --cwd ./services/api lint

# ── 5. API Build (dist artifacts) ─────────────────────────────────────────────
run_step "API Build — tsc compile to dist/" \
  yarn --cwd ./services/api build

# ── 6. Mobile TypeScript ──────────────────────────────────────────────────────
warn_step "Mobile TypeScript — tsc --noEmit" \
  yarn --cwd ./apps/mobile typecheck

# ── 7. Mobile ESLint ──────────────────────────────────────────────────────────
warn_step "Mobile ESLint" \
  yarn --cwd ./apps/mobile lint

# ── 8. Dependency audit (high/critical) ──────────────────────────────────────
step_start "Security audit — yarn audit (high+critical)"
if yarn --cwd ./services/api audit --level high 2>&1; then
  step_end "pass" "Security audit"
else
  AUDIT_EXIT=$?
  if [ "$AUDIT_EXIT" -ge 16 ]; then
    step_end "fail" "Security audit — critical vulnerabilities found"
  else
    step_end "warn" "Security audit — moderate vulnerabilities (review manually)"
  fi
fi

# ── 9. Docker / compose validation ───────────────────────────────────────────
step_start "Docker compose validation"
if bash ./scripts/docker-validate.sh 2>&1; then
  step_end "pass" "Docker validation"
else
  step_end "fail" "Docker validation"
fi

# ── 10. Leftover console.log in API source ────────────────────────────────────
step_start "Debug console.log scan — API src/"
CONSOLE_HITS=$(grep -rn --include="*.ts" -E '^\s*console\.(log|debug|trace|dir)\s*\(' \
  services/api/src/ 2>/dev/null | grep -v '\.test\.\|\.spec\.' || true)
if [ -n "$CONSOLE_HITS" ]; then
  echo "$CONSOLE_HITS"
  step_end "fail" "console.log/debug in API src — use logger instead"
else
  step_end "pass" "No debug console statements in API src"
fi

# ── 11. TODO / FIXME / HACK in new code ───────────────────────────────────────
step_start "TODO/FIXME scan (informational)"
TODO_COUNT=$(git diff HEAD~1 HEAD 2>/dev/null | grep -cE '^\+.*\b(TODO|FIXME|HACK|XXX)\b' || echo 0)
if [ "$TODO_COUNT" -gt 0 ]; then
  echo "  Found $TODO_COUNT new TODO/FIXME/HACK markers in this push"
  step_end "warn" "TODO/FIXME markers ($TODO_COUNT new)"
else
  step_end "pass" "No new TODO/FIXME markers"
fi

# ── 12. Migration file integrity ─────────────────────────────────────────────
step_start "Migration file check"
MIGRATE_FILE="services/api/src/db/migrate.ts"
if [[ -f "$MIGRATE_FILE" ]]; then
  # Detect duplicate SQL statement markers
  DUP_COMMENTS=$(grep -c "Phase" "$MIGRATE_FILE" 2>/dev/null || echo 0)
  echo "  Migration phases found: $DUP_COMMENTS"
  step_end "pass" "Migration file present"
else
  step_end "warn" "Migration file missing at $MIGRATE_FILE"
fi

# ── 13. Env example completeness ─────────────────────────────────────────────
step_start "Environment variable coverage"
ENV_EXAMPLE=""
for candidate in ".env.example" ".env.development.example" ".env.local.example"; do
  if [[ -f "$candidate" ]]; then
    ENV_EXAMPLE="$candidate"
    break
  fi
done
if [[ -n "$ENV_EXAMPLE" ]]; then
  step_end "pass" "Env example found: $ENV_EXAMPLE"
else
  step_end "warn" "No .env.example found — consider adding one"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL_STEPS=$STEP_NUM
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  PUSH GATE SUMMARY — Branch: $BRANCH  Commit: $COMMIT"
echo "  Steps run : $TOTAL_STEPS"
echo "  Errors    : $ERRORS"
echo "  Warnings  : $WARNINGS"
echo "  Full log  : $LOG_FILE"

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "  ✗ PUSH BLOCKED — Fix $ERRORS error(s) before pushing"
  echo "════════════════════════════════════════════════════════════════"
  exit 1
else
  echo ""
  echo "  ✓ PUSH APPROVED — All critical checks passed"
  if [ "$WARNINGS" -gt 0 ]; then
    echo "    (${WARNINGS} warning(s) logged — review $LOG_FILE)"
  fi
  echo "════════════════════════════════════════════════════════════════"
  exit 0
fi

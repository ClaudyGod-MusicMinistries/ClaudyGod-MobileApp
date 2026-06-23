#!/usr/bin/env bash
# =============================================================================
#  PRE-COMMIT HOOK — ClaudyGod Monorepo
#  Runs on every commit. Checks only staged files.
#  Logs results to logs/git-hooks/precommit-YYYY-MM-DD_HH-MM-SS.log
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ── Silence npm lifecycle noise ───────────────────────────────────────────────
unset npm_config_version_commit_hooks npm_config_version_tag_prefix \
      npm_config_version_git_message npm_config_version_git_tag \
      npm_config_argv 2>/dev/null || true

# ── Log setup ─────────────────────────────────────────────────────────────────
LOG_DIR="$ROOT_DIR/logs/git-hooks"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_FILE="$LOG_DIR/precommit-${TIMESTAMP}.log"

# Tee: print to terminal AND write to log file
exec > >(tee -a "$LOG_FILE") 2>&1

echo "════════════════════════════════════════════════════════════"
echo "  ClaudyGod Pre-Commit Gate  •  $TIMESTAMP"
echo "  Log: $LOG_FILE"
echo "════════════════════════════════════════════════════════════"

# ── Staged file list ──────────────────────────────────────────────────────────
mapfile -t STAGED < <(git diff --cached --name-only --diff-filter=ACMR)

if [ "${#STAGED[@]}" -eq 0 ]; then
  echo "[SKIP] No staged files — nothing to check."
  exit 0
fi

echo ""
echo "[INFO] Staged files (${#STAGED[@]}):"
printf '  • %s\n' "${staged[@]+"${STAGED[@]}"}"

# ── Helpers ───────────────────────────────────────────────────────────────────
ERRORS=0
WARNINGS=0

has_match() {
  printf '%s\n' "${STAGED[@]}" | grep -Eq "$1"
}

step_start() { echo ""; echo "──── $1 ────"; }
step_pass()  { echo "[PASS] $1"; }
step_fail()  { echo "[FAIL] $1"; ((ERRORS++)) || true; }
step_warn()  { echo "[WARN] $1"; ((WARNINGS++)) || true; }
step_skip()  { echo "[SKIP] $1"; }

# ── 1. Merge conflict markers ─────────────────────────────────────────────────
step_start "Merge conflict markers"
CONFLICT_FILES=()
for f in "${STAGED[@]}"; do
  if [[ -f "$f" ]] && grep -qE '^(<<<<<<<|=======|>>>>>>>)' "$f" 2>/dev/null; then
    CONFLICT_FILES+=("$f")
  fi
done
if [ "${#CONFLICT_FILES[@]}" -gt 0 ]; then
  step_fail "Conflict markers found in ${#CONFLICT_FILES[@]} file(s):"
  printf '  ✗ %s\n' "${CONFLICT_FILES[@]}"
else
  step_pass "No conflict markers"
fi

# ── 2. Secrets / credential patterns ─────────────────────────────────────────
step_start "Secrets scan"
SECRET_PATTERNS=(
  'AKIA[0-9A-Z]{16}'                    # AWS access key
  'AIza[0-9A-Za-z_-]{35}'              # Google API key
  'sk_live_[0-9a-zA-Z]{24,}'           # Stripe live secret
  'sk_test_[0-9a-zA-Z]{24,}'           # Stripe test secret
  'ghp_[A-Za-z0-9]{36}'               # GitHub personal token
  'xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+'   # Slack bot token
  'ya29\.[0-9A-Za-z_-]+'              # Google OAuth token
  '-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----'
  'password\s*=\s*["\x27][^"\x27]{8,}["\x27]'
  'secret\s*=\s*["\x27][^"\x27]{8,}["\x27]'
)
SECRET_FOUND=0
for f in "${STAGED[@]}"; do
  # Skip non-files, example templates, and UI source files (vue/tsx components
  # legitimately contain form field names like password= which are not secrets)
  if [[ ! -f "$f" ]] || [[ "$f" == *.env.example ]] || [[ "$f" == *.example ]] || \
     [[ "$f" =~ \.(vue|tsx|jsx)$ && "$f" =~ ^(admin|apps)/ ]]; then
    continue
  fi
  for pat in "${SECRET_PATTERNS[@]}"; do
    if grep -qE "$pat" "$f" 2>/dev/null; then
      step_fail "Possible secret in $f (pattern: ${pat:0:30}…)"
      SECRET_FOUND=1
      break
    fi
  done
done
if [ "$SECRET_FOUND" -eq 0 ]; then
  step_pass "No secrets detected"
fi

# ── 3. Debug / console.log in production source ───────────────────────────────
step_start "Debug statements"
DEBUG_FILES=()
for f in "${STAGED[@]}"; do
  if [[ "$f" =~ \.(ts|tsx|js|jsx)$ ]] && [[ ! "$f" =~ \.test\. ]] && [[ ! "$f" =~ \.spec\. ]]; then
    if grep -nE '^\s*console\.(log|debug|trace|dir)\s*\(' "$f" 2>/dev/null; then
      DEBUG_FILES+=("$f")
    fi
  fi
done
if [ "${#DEBUG_FILES[@]}" -gt 0 ]; then
  step_warn "console.log/debug found in ${#DEBUG_FILES[@]} file(s) — replace with logger"
else
  step_pass "No debug console statements"
fi

# ── 4. Large files (>500 KB) ──────────────────────────────────────────────────
step_start "Large file check (>500 KB)"
LARGE_FILES=()
# Lockfiles are auto-generated and allowed to exceed the size threshold
LARGE_FILE_EXEMPT_PATTERN='(yarn\.lock|package-lock\.json|pnpm-lock\.yaml|composer\.lock|Gemfile\.lock|Cargo\.lock|poetry\.lock)$'
for f in "${STAGED[@]}"; do
  if [[ -f "$f" ]] && ! [[ "$f" =~ $LARGE_FILE_EXEMPT_PATTERN ]]; then
    SIZE=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 524288 ]; then
      LARGE_FILES+=("$f ($(( SIZE / 1024 )) KB)")
    fi
  fi
done
if [ "${#LARGE_FILES[@]}" -gt 0 ]; then
  step_fail "Large files staged:"
  printf '  ✗ %s\n' "${LARGE_FILES[@]}"
else
  step_pass "No oversized files"
fi

# ── 5. API TypeScript type check ──────────────────────────────────────────────
if has_match '^services/api/.*\.(ts|tsx|js|json)$'; then
  step_start "API TypeScript (tsc --noEmit)"
  if yarn --cwd ./services/api typecheck 2>&1; then
    step_pass "API typechecks clean"
  else
    step_fail "API TypeScript errors — commit blocked"
  fi
else
  step_skip "API TypeScript (no API files staged)"
fi

# ── 6. API ESLint ─────────────────────────────────────────────────────────────
if has_match '^services/api/src/.*\.ts$'; then
  step_start "API ESLint"
  if yarn --cwd ./services/api lint 2>&1; then
    step_pass "API lint clean"
  else
    step_fail "API ESLint errors — commit blocked"
  fi
else
  step_skip "API ESLint (no API source files staged)"
fi

# ── 7. Mobile TypeScript ──────────────────────────────────────────────────────
if has_match '^apps/mobile/.*\.(ts|tsx)$'; then
  step_start "Mobile TypeScript"
  if yarn --cwd ./apps/mobile typecheck 2>&1; then
    step_pass "Mobile typechecks clean"
  else
    step_warn "Mobile TypeScript issues (not blocking — fix before push)"
  fi
else
  step_skip "Mobile TypeScript (no mobile files staged)"
fi

# ── 8. Mobile ESLint ──────────────────────────────────────────────────────────
if has_match '^apps/mobile/.*\.(ts|tsx|js|jsx)$'; then
  step_start "Mobile ESLint"
  if bash ./scripts/precommit-mobile-staged.sh 2>&1; then
    step_pass "Mobile lint clean"
  else
    step_warn "Mobile lint issues (not blocking — fix before push)"
  fi
else
  step_skip "Mobile ESLint (no mobile files staged)"
fi

# ── 9. Docker / compose validation ───────────────────────────────────────────
if has_match '(^|/)docker-compose.*\.ya?ml$|(^|/)Dockerfile'; then
  step_start "Docker compose validation"
  if bash ./scripts/docker-validate.sh 2>&1; then
    step_pass "Docker configs valid"
  else
    step_fail "Docker config errors — commit blocked"
  fi
else
  step_skip "Docker validation (no Docker files staged)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
if [ "$ERRORS" -gt 0 ]; then
  echo "  COMMIT BLOCKED — $ERRORS error(s), $WARNINGS warning(s)"
  echo "  Full log: $LOG_FILE"
  echo "════════════════════════════════════════════════════════════"
  exit 1
else
  echo "  PRE-COMMIT PASSED — 0 errors, $WARNINGS warning(s)"
  echo "  Full log: $LOG_FILE"
  echo "════════════════════════════════════════════════════════════"
  exit 0
fi

#!/usr/bin/env bash
# ================================================================
# ClaudyGod — Server Diagnostic Script
# Run on the production server:
#   bash scripts/diagnose-server.sh
# ================================================================
set -uo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

PASS="${GREEN}[PASS]${NC}"
FAIL="${RED}[FAIL]${NC}"
WARN="${YELLOW}[WARN]${NC}"
INFO="${CYAN}[INFO]${NC}"

section() { printf "\n${BOLD}${CYAN}══ %s ══${NC}\n" "$1"; }
row()     { printf "  %-42s %b\n" "$1" "$2"; }

# ── 0. Locate project root ────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

printf "${BOLD}ClaudyGod Server Diagnostic${NC}  ($(date '+%Y-%m-%d %H:%M:%S'))\n"
printf "${DIM}Root: %s${NC}\n" "$ROOT_DIR"

# ── 1. Environment file ───────────────────────────────────────────────────────
section "1. Environment file"

ENV_FILE="$ROOT_DIR/.env.production"
if [ -f "$ENV_FILE" ]; then
  row ".env.production exists" "$PASS"
  API_DOMAIN=$(grep -E '^API_DOMAIN=' "$ENV_FILE" | cut -d= -f2 | tr -d '"' | tr -d "'")
  APP_DOMAIN=$(grep -E '^APP_DOMAIN=' "$ENV_FILE" | cut -d= -f2 | tr -d '"' | tr -d "'")
  ADMIN_DOMAIN=$(grep -E '^ADMIN_DOMAIN=' "$ENV_FILE" | cut -d= -f2 | tr -d '"' | tr -d "'")
  CORS_ORIGIN=$(grep -E '^CORS_ORIGIN=' "$ENV_FILE" | cut -d= -f2 | tr -d '"' | tr -d "'")
  VITE_API_URL=$(grep -E '^VITE_API_URL=' "$ENV_FILE" | cut -d= -f2 | tr -d '"' | tr -d "'")

  row "API_DOMAIN" "${CYAN}${API_DOMAIN:-<not set>}${NC}"
  row "APP_DOMAIN" "${CYAN}${APP_DOMAIN:-<not set>}${NC}"
  row "ADMIN_DOMAIN" "${CYAN}${ADMIN_DOMAIN:-<not set>}${NC}"
  row "CORS_ORIGIN" "${CYAN}${CORS_ORIGIN:-<not set>}${NC}"
  row "VITE_API_URL" "${CYAN}${VITE_API_URL:-<not set>}${NC}"
else
  row ".env.production exists" "$FAIL — file not found at $ENV_FILE"
  API_DOMAIN=""
  CORS_ORIGIN=""
  VITE_API_URL=""
fi

# ── 2. Docker containers ──────────────────────────────────────────────────────
section "2. Docker container status"

if ! command -v docker &>/dev/null; then
  row "Docker available" "$FAIL — docker not found"
else
  row "Docker available" "$PASS"
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | while IFS= read -r line; do
    printf "  ${DIM}%s${NC}\n" "$line"
  done
fi

# ── 3. Traefik routing rules ──────────────────────────────────────────────────
section "3. Traefik routing rules"

if docker inspect traefik &>/dev/null 2>&1 || docker ps --filter name=traefik -q | grep -q .; then
  row "Traefik container running" "$PASS"

  # Pull routers from Traefik API (default port 8080 internal)
  TRAEFIK_API=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
    "$(docker ps --filter name=traefik -q | head -1)" 2>/dev/null)

  if [ -n "$TRAEFIK_API" ]; then
    printf "  ${DIM}Traefik internal IP: %s${NC}\n" "$TRAEFIK_API"
    printf "  ${DIM}Active HTTP routers:${NC}\n"
    curl -s "http://$TRAEFIK_API:8080/api/http/routers" 2>/dev/null | \
      python3 -c "
import sys, json
try:
  routers = json.load(sys.stdin)
  for r in routers:
    name = r.get('name','?')
    rule = r.get('rule','?')
    status = r.get('status','?')
    print(f'    {name:<40} {rule}  [{status}]')
except Exception as e:
  print(f'  Could not parse Traefik API: {e}')
" 2>/dev/null || printf "  ${WARN} Could not reach Traefik API on port 8080\n"
  fi
else
  row "Traefik container running" "$WARN — container not found (may use external Traefik)"
fi

# ── 4. DNS resolution from server ────────────────────────────────────────────
section "4. DNS resolution (from this server)"

for domain in "${API_DOMAIN:-apimobile.claudygod.org}" "api.claudygod.org" "${ADMIN_DOMAIN:-mobileadmin.claudygod.org}" "${APP_DOMAIN:-mobileapp.claudygod.org}"; do
  if command -v dig &>/dev/null; then
    ip=$(dig +short "$domain" 2>/dev/null | tail -1)
  elif command -v nslookup &>/dev/null; then
    ip=$(nslookup "$domain" 2>/dev/null | grep 'Address:' | tail -1 | awk '{print $2}')
  else
    ip="(dig/nslookup not available)"
  fi
  row "$domain" "${CYAN}→ ${ip:-<unresolved>}${NC}"
done

# ── 5. HTTP reachability + CORS headers ──────────────────────────────────────
section "5. HTTP / CORS check (curl from server)"

ORIGIN="https://${ADMIN_DOMAIN:-mobileadmin.claudygod.org}"
API_BASE="https://${API_DOMAIN:-apimobile.claudygod.org}"
API_OLD="https://api.claudygod.org"

check_cors() {
  local url="$1"
  local origin="$2"
  local label="$3"

  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS "$url" \
    -H "Origin: $origin" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Authorization,Content-Type,X-Mobile-Api-Key" \
    --max-time 10 2>/dev/null)

  local headers
  headers=$(curl -s -I \
    -X OPTIONS "$url" \
    -H "Origin: $origin" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Authorization,Content-Type,X-Mobile-Api-Key" \
    --max-time 10 2>/dev/null)

  local acao
  acao=$(echo "$headers" | grep -i "access-control-allow-origin" | tr -d '\r')

  printf "\n  ${BOLD}%s${NC}\n" "$label"
  printf "  URL    : %s\n" "$url"
  printf "  Origin : %s\n" "$origin"
  printf "  HTTP   : %s\n" "$response"

  if [ -n "$acao" ]; then
    printf "  ${GREEN}%s${NC}\n" "$acao"
    row "  CORS preflight" "$PASS"
  else
    printf "  ${RED}No Access-Control-Allow-Origin header in response${NC}\n"
    row "  CORS preflight" "$FAIL"
  fi
}

check_cors "$API_BASE/health"              "$ORIGIN" "Current API domain (should work)"
check_cors "$API_OLD/health"               "$ORIGIN" "Old API domain api.claudygod.org (likely broken)"
check_cors "$API_BASE/v1/auth/login"       "$ORIGIN" "Login endpoint on correct domain"

# ── 6. What URL is baked into the admin image ─────────────────────────────────
section "6. Baked-in API URL inside admin-web container"

ADMIN_CONTAINER=$(docker ps --filter name=admin --format '{{.Names}}' 2>/dev/null | head -1)
if [ -n "$ADMIN_CONTAINER" ]; then
  row "Admin container found" "${CYAN}${ADMIN_CONTAINER}${NC}"
  printf "  ${DIM}Searching for API URL in compiled bundle...${NC}\n"

  # Grep the compiled JS for any claudygod API domain references
  docker exec "$ADMIN_CONTAINER" sh -c \
    "grep -roh 'https://[a-z.]*claudygod[a-z./]*' /usr/share/nginx/html/ 2>/dev/null | sort -u" \
    2>/dev/null | while read -r url; do
      printf "    found: ${CYAN}%s${NC}\n" "$url"
    done || printf "  ${WARN} Could not exec into admin container\n"
else
  row "Admin container found" "$WARN — no container matching 'admin' found"
fi

# ── 7. What URL is baked into the mobile-web image ───────────────────────────
section "7. Baked-in API URL inside mobile-web container"

MOBILE_CONTAINER=$(docker ps --filter name=mobile --format '{{.Names}}' 2>/dev/null | head -1)
if [ -n "$MOBILE_CONTAINER" ]; then
  row "Mobile container found" "${CYAN}${MOBILE_CONTAINER}${NC}"
  printf "  ${DIM}Searching for API URL in compiled bundle...${NC}\n"
  docker exec "$MOBILE_CONTAINER" sh -c \
    "grep -roh 'https://[a-z.]*claudygod[a-z./]*' /usr/share/nginx/html/ 2>/dev/null | sort -u" \
    2>/dev/null | while read -r url; do
      printf "    found: ${CYAN}%s${NC}\n" "$url"
    done || printf "  ${WARN} Could not exec into mobile container\n"
else
  row "Mobile container found" "$WARN — no container matching 'mobile' found"
fi

# ── 8. API health check ───────────────────────────────────────────────────────
section "8. API health endpoint"

for api_url in "$API_BASE" "$API_OLD"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$api_url/health" 2>/dev/null)
  if [ "$status" = "200" ]; then
    row "$api_url/health" "$PASS  (HTTP $status)"
  elif [ "$status" = "000" ]; then
    row "$api_url/health" "$FAIL  (no response / timeout)"
  else
    row "$api_url/health" "$WARN  (HTTP $status)"
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
section "Summary"
printf "
  If section 6 shows ${CYAN}api.claudygod.org${NC} inside the admin bundle:
    → The admin image was built with the wrong VITE_API_URL.
    → Fix: update GitHub Variable VITE_API_URL to https://${API_DOMAIN:-apimobile.claudygod.org}
      and re-run the deploy workflow (or rebuild locally).

  If section 5 shows CORS FAIL for the old domain api.claudygod.org:
    → Traefik has no route for that domain. Requests return no CORS headers.
    → Same fix as above — rebuild the admin image with the correct URL.

  If section 5 shows CORS FAIL for the correct domain:
    → Check CORS_ORIGIN in .env.production includes the admin domain.
    → Restart the API container: make deploy-up
\n"

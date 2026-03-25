#!/bin/bash
set -eu

# Email diagnostics script for ClaudyGod

echo "=== ClaudyGod Email Diagnostics ==="
echo ""

# Check if production environment is loaded
if [ ! -f .env.production ]; then
  echo "❌ Missing .env.production file"
  exit 1
fi

echo "✓ Loading production environment..."
set -a
source .env.production
set +a

echo ""
echo "=== SMTP Configuration Check ==="
echo "Provider: $SMTP_PROVIDER"
echo "Host: $SMTP_HOST"
echo "Port: $SMTP_PORT"
echo "Username: $POSTFIX_SMTP_USERNAME"
echo "Secure (SMTP_SECURE): $SMTP_SECURE"
echo "Require TLS: $SMTP_REQUIRE_TLS"
echo ""

echo "=== Container Status ==="
docker compose --env-file .env.production -f docker-compose.production.yml ps | grep -E "api|worker|postfix-relay|redis" || echo "No containers running"
echo ""

echo "=== Health Endpoint Check ==="
if curl -s https://api.claudygod.org/health > /dev/null 2>&1; then
  echo "Checking SMTP status from health endpoint..."
  SMTP_STATUS=$(curl -s https://api.claudygod.org/health | jq '.smtp' 2>/dev/null || echo "null")
  echo "SMTP Status: $SMTP_STATUS"
else
  echo "⚠️  API not reachable at https://api.claudygod.org"
fi
echo ""

echo "=== Recommended Next Steps ==="
echo ""
echo "1. Deploy the updated code to production:"
echo "   npm run docker:prod:up"
echo ""
echo "2. Wait for containers to be healthy (2-3 minutes):"
echo "   docker compose --env-file .env.production -f docker-compose.production.yml logs -f"
echo ""
echo "3. Check SMTP connectivity:"
echo "   curl https://api.claudygod.org/health | jq '.smtp'"
echo ""
echo "4. If SMTP shows unreachable, restart the worker:"
echo "   docker compose --env-file .env.production -f docker-compose.production.yml restart worker"
echo ""
echo "5. Monitor email processing:"
echo "   docker compose --env-file .env.production -f docker-compose.production.yml logs -f worker"
echo ""

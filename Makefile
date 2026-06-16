# ============================================================
#  ClaudyGod — Monorepo Makefile
#  Package manager: yarn (--cwd for per-workspace commands)
# ============================================================

MOBILE_DIR  := apps/mobile
API_DIR     := services/api
ADMIN_DIR   := admin/web

# ── GHCR / CI-CD config ───────────────────────────────────────────────────────
GHCR_OWNER   ?= claudygod-musicministries
REGISTRY     := ghcr.io/$(GHCR_OWNER)
GIT_SHA      := $(shell git rev-parse --short HEAD 2>/dev/null || echo unknown)
IMAGE_TAG    ?= latest

API_IMAGE    := $(REGISTRY)/claudygod-api
ADMIN_IMAGE  := $(REGISTRY)/claudygod-admin
MOBILE_IMAGE := $(REGISTRY)/claudygod-mobile
POSTFIX_IMAGE := $(REGISTRY)/claudygod-postfix

COMPOSE_PROD := docker compose -f docker-compose.production.yml --env-file .env.production

BLUE   := \033[0;34m
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
CYAN   := \033[0;36m
BOLD   := \033[1m
NC     := \033[0m

.DEFAULT_GOAL := help

.PHONY: help \
	install ci-install setup env-setup hooks-install \
	review review-logs \
	dev dev-api dev-worker dev-admin dev-ios dev-android \
	build build-api build-admin build-mobile-web \
	lint lint-api lint-admin lint-mobile lint-fix lint-fix-api lint-fix-mobile \
	typecheck typecheck-api typecheck-mobile typecheck-root quality-gate \
	test test-api test-mobile \
	db-migrate db-migrate-status db-rollback \
	docker-local-up docker-local-down docker-local-logs \
	docker-local-mobile-web docker-local-mobile-native \
	docker-prod-up docker-prod-down docker-prod-logs docker-validate \
	eas-build-android eas-build-ios eas-update \
	clean clean-all \
	status pull push \
	ghcr-login \
	docker-build docker-build-api docker-build-admin docker-build-mobile docker-build-postfix \
	docker-push release \
	deploy deploy-pull deploy-migrate deploy-up deploy-down \
	deploy-logs deploy-status rollback update \
	logs clean-legacy setup-admin

# ─── Help ────────────────────────────────────────────────────────────────────

help:
	@printf "$(BOLD)$(BLUE)╔══════════════════════════════════════════════╗$(NC)\n"
	@printf "$(BOLD)$(BLUE)║        ClaudyGod Monorepo Commands           ║$(NC)\n"
	@printf "$(BOLD)$(BLUE)╚══════════════════════════════════════════════╝$(NC)\n"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Quality Gates$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make review"              "Full repo review — same as pre-push gate"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make review-logs"         "List recent hook log files"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Setup$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make install"             "Install all workspace dependencies"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make ci-install"          "Install with --frozen-lockfile (CI use)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make setup"               "install + build-api"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make env-setup"           "Copy .env.development.example → .env.development"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make hooks-install"       "Install lefthook git hooks"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Development$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make dev"                 "Start mobile Expo dev server"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make dev-api"             "Start API with hot-reload (ts-node-dev)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make dev-worker"          "Start BullMQ background workers"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make dev-admin"           "Start admin web (Vite dev server)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make dev-ios"             "Start Expo on iOS simulator"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make dev-android"         "Start Expo on Android emulator"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Build$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make build"               "Build API + admin + mobile-web"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make build-api"           "Compile TypeScript → dist/"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make build-admin"         "Vite production build for admin"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make build-mobile-web"    "Export Expo web bundle"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Code Quality$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make lint"                "Lint all workspaces"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make lint-fix"            "Auto-fix lint issues (all workspaces)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make typecheck"           "Type-check all workspaces"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make quality-gate"        "lint + typecheck + test (CI gate)"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Testing$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make test"                "Run all test suites"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make test-api"            "Run API unit tests"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make test-mobile"         "Run mobile Jest tests"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Database$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make db-migrate"          "Run pending migrations"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make db-migrate-status"   "Show migration status"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make db-rollback"         "Roll back last migration"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Docker$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make docker-local-up"     "Start local stack (API + Redis + Admin)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make docker-local-down"   "Stop local stack"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make docker-local-logs"   "Tail logs for local stack"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make docker-prod-up"      "Start production stack (detached)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make docker-prod-down"    "Stop production stack"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make docker-prod-logs"    "Tail logs for production stack"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make docker-validate"     "Validate docker-compose configs"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)EAS (Expo Application Services)$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make eas-build-android"   "EAS build for Android"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make eas-build-ios"       "EAS build for iOS"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make eas-update"          "Publish OTA update via EAS"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Clean$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make clean"               "Remove build artifacts"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make clean-all"           "Remove artifacts + all node_modules"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)Git$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make status"              "git status"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make pull"                "git pull origin main"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make push"                "git push origin main"
	@printf "\n"
	@printf "$(CYAN)$(BOLD)GHCR / CI-CD  (GHCR_OWNER=$(GHCR_OWNER), IMAGE_TAG=$(IMAGE_TAG))$(NC)\n"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make ghcr-login"          "docker login ghcr.io (needs GITHUB_TOKEN env var)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make docker-build"        "Build all images locally (also tags :SHA)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make docker-push"         "Push all images to GHCR"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make release"             "Build + push all images (full CI step)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make deploy"              "SERVER: pull latest + migrate + up"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make deploy-pull"         "SERVER: pull latest GHCR images"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make deploy-migrate"      "SERVER: run pending DB migrations"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make deploy-up"           "SERVER: docker compose up -d"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make deploy-down"         "SERVER: docker compose down"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make deploy-logs"         "SERVER: tail live logs"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make logs"                "SERVER: tail live logs (shorthand)"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make deploy-status"       "SERVER: show container health"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make rollback SHA=abc123"  "SERVER: redeploy a specific git SHA"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make update"              "SERVER: git pull + full deploy"
	@printf "  $(GREEN)%-30s$(NC) %s\n" "make clean-legacy"        "SERVER: remove old claudygod_* containers + restart API"

# ─── Setup ───────────────────────────────────────────────────────────────────

install:
	@printf "$(BLUE)Installing all workspace dependencies...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) install
	yarn --cwd $(API_DIR) install
	yarn --cwd $(ADMIN_DIR) install
	@printf "$(GREEN)✓ All dependencies installed$(NC)\n"

ci-install:
	@printf "$(BLUE)CI install (frozen lockfile)...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) install --frozen-lockfile
	yarn --cwd $(API_DIR) install --frozen-lockfile
	yarn --cwd $(ADMIN_DIR) install --frozen-lockfile
	@printf "$(GREEN)✓ CI install complete$(NC)\n"

setup: install build-api
	@printf "$(GREEN)✓ Project ready$(NC)\n"

env-setup:
	@printf "$(BLUE)Setting up development environment file...$(NC)\n"
	@if [ ! -f .env.development ]; then \
		cp .env.example .env.development; \
		printf "$(GREEN)✓ .env.development created from .env.example — fill in your real values$(NC)\n"; \
	else \
		printf "$(YELLOW)⚠ .env.development already exists — skipping$(NC)\n"; \
	fi

hooks-install:
	@printf "$(BLUE)Installing lefthook git hooks...$(NC)\n"
	yarn hooks:install
	@printf "$(GREEN)✓ Git hooks installed$(NC)\n"

review:
	@printf "$(BOLD)$(BLUE)Running full repo review (same gate as pre-push)...$(NC)\n"
	bash ./scripts/review-all.sh

review-logs:
	@printf "$(CYAN)Recent hook logs:$(NC)\n"
	@ls -lt logs/git-hooks/ 2>/dev/null | head -10 || printf "$(YELLOW)No logs yet$(NC)\n"

# ─── Development ─────────────────────────────────────────────────────────────

dev:
	@printf "$(BLUE)Starting Expo dev server...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) start

dev-api:
	@printf "$(BLUE)Starting API (ts-node-dev hot-reload)...$(NC)\n"
	yarn --cwd $(API_DIR) dev

dev-worker:
	@printf "$(BLUE)Starting BullMQ background workers...$(NC)\n"
	yarn --cwd $(API_DIR) dev:worker

dev-admin:
	@printf "$(BLUE)Starting admin web (Vite dev server)...$(NC)\n"
	yarn --cwd $(ADMIN_DIR) dev

dev-ios:
	@printf "$(BLUE)Starting Expo on iOS simulator...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) ios

dev-android:
	@printf "$(BLUE)Starting Expo on Android emulator...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) android

# ─── Build ───────────────────────────────────────────────────────────────────

build: build-api build-admin build-mobile-web
	@printf "$(GREEN)✓ All targets built$(NC)\n"

build-api:
	@printf "$(BLUE)Compiling API TypeScript → dist/...$(NC)\n"
	yarn --cwd $(API_DIR) build
	@printf "$(GREEN)✓ API build complete$(NC)\n"

build-admin:
	@printf "$(BLUE)Building admin web (Vite production)...$(NC)\n"
	yarn --cwd $(ADMIN_DIR) build
	@printf "$(GREEN)✓ Admin build complete$(NC)\n"

build-mobile-web:
	@printf "$(BLUE)Exporting Expo web bundle...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) export:web
	@printf "$(GREEN)✓ Mobile web export complete$(NC)\n"

# ─── Code Quality ────────────────────────────────────────────────────────────

lint: lint-api lint-mobile
	@printf "$(GREEN)✓ All linting passed$(NC)\n"

lint-api:
	@printf "$(BLUE)Linting API...$(NC)\n"
	yarn --cwd $(API_DIR) lint

lint-admin:
	@printf "$(BLUE)Linting admin web...$(NC)\n"
	yarn --cwd $(ADMIN_DIR) lint

lint-mobile:
	@printf "$(BLUE)Linting mobile...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) lint

lint-fix: lint-fix-api lint-fix-mobile
	@printf "$(GREEN)✓ Lint fixes applied$(NC)\n"

lint-fix-api:
	@printf "$(BLUE)Auto-fixing API lint...$(NC)\n"
	yarn --cwd $(API_DIR) lint:fix

lint-fix-mobile:
	@printf "$(BLUE)Auto-fixing mobile lint...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) lint:fix

typecheck: typecheck-root typecheck-api typecheck-mobile
	@printf "$(GREEN)✓ All type checks passed$(NC)\n"

typecheck-root:
	@printf "$(BLUE)Type-checking root workspace...$(NC)\n"
	yarn typecheck

typecheck-api:
	@printf "$(BLUE)Type-checking API...$(NC)\n"
	yarn --cwd $(API_DIR) typecheck

typecheck-mobile:
	@printf "$(BLUE)Type-checking mobile...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) typecheck

quality-gate:
	@printf "$(BOLD)$(BLUE)Running quality gate (lint → typecheck → test)...$(NC)\n"
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test
	@printf "$(BOLD)$(GREEN)✓ Quality gate passed$(NC)\n"

# ─── Testing ─────────────────────────────────────────────────────────────────

test: test-api test-mobile
	@printf "$(GREEN)✓ All tests passed$(NC)\n"

test-api:
	@printf "$(BLUE)Running API tests...$(NC)\n"
	yarn --cwd $(API_DIR) test

test-mobile:
	@printf "$(BLUE)Running mobile tests...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) test

# ─── Database ────────────────────────────────────────────────────────────────

db-migrate:
	@printf "$(BLUE)Running pending database migrations...$(NC)\n"
	yarn --cwd $(API_DIR) migrate
	@printf "$(GREEN)✓ Migrations complete$(NC)\n"

db-migrate-status:
	@printf "$(BLUE)Migration status:$(NC)\n"
	yarn --cwd $(API_DIR) migrate:status

db-rollback:
	@printf "$(YELLOW)Rolling back last migration...$(NC)\n"
	yarn --cwd $(API_DIR) migrate:rollback
	@printf "$(GREEN)✓ Rollback complete$(NC)\n"

# ─── Docker ──────────────────────────────────────────────────────────────────

docker-local-up:
	@printf "$(BLUE)Starting local Docker stack...$(NC)\n"
	yarn docker:local:up

docker-local-down:
	@printf "$(BLUE)Stopping local Docker stack...$(NC)\n"
	yarn docker:local:down

docker-local-logs:
	@printf "$(BLUE)Tailing local stack logs...$(NC)\n"
	yarn docker:local:logs

docker-local-mobile-web:
	@printf "$(BLUE)Starting local stack + mobile-web profile...$(NC)\n"
	yarn docker:local:up:mobile-web

docker-local-mobile-native:
	@printf "$(BLUE)Starting local stack + mobile-native profile...$(NC)\n"
	yarn docker:local:up:mobile-native

docker-prod-up:
	@printf "$(BLUE)Starting production Docker stack (detached)...$(NC)\n"
	yarn docker:prod:up

docker-prod-down:
	@printf "$(BLUE)Stopping production Docker stack...$(NC)\n"
	yarn docker:prod:down

docker-prod-logs:
	@printf "$(BLUE)Tailing production stack logs...$(NC)\n"
	yarn docker:prod:logs

docker-validate:
	@printf "$(BLUE)Validating docker-compose configs...$(NC)\n"
	yarn docker:config
	@printf "$(GREEN)✓ Docker configs valid$(NC)\n"

# ─── EAS (Expo Application Services) ─────────────────────────────────────────

eas-build-android:
	@printf "$(BLUE)EAS build: Android...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) eas build --platform android

eas-build-ios:
	@printf "$(BLUE)EAS build: iOS...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) eas build --platform ios

eas-update:
	@printf "$(BLUE)Publishing EAS OTA update...$(NC)\n"
	yarn --cwd $(MOBILE_DIR) eas update

# ─── Clean ───────────────────────────────────────────────────────────────────

clean:
	@printf "$(BLUE)Removing build artifacts...$(NC)\n"
	rm -rf $(API_DIR)/dist
	rm -rf $(MOBILE_DIR)/.expo $(MOBILE_DIR)/dist $(MOBILE_DIR)/build $(MOBILE_DIR)/web-build
	rm -rf $(ADMIN_DIR)/dist
	@printf "$(GREEN)✓ Build artifacts removed$(NC)\n"

clean-all: clean
	@printf "$(BLUE)Removing all node_modules...$(NC)\n"
	rm -rf $(MOBILE_DIR)/node_modules
	rm -rf $(API_DIR)/node_modules
	rm -rf $(ADMIN_DIR)/node_modules
	rm -rf node_modules
	@printf "$(GREEN)✓ Full clean complete$(NC)\n"

# ─── Git ─────────────────────────────────────────────────────────────────────

status:
	@git status

pull:
	@printf "$(BLUE)Pulling from origin/main...$(NC)\n"
	git pull origin main

push:
	@printf "$(BLUE)Pushing to origin/main...$(NC)\n"
	git push origin main

# ─── GHCR login ──────────────────────────────────────────────────────────────
# Requires GITHUB_TOKEN env var:
#   export GITHUB_TOKEN=ghp_...
#   make ghcr-login

ghcr-login:
	@printf "$(BLUE)Logging in to ghcr.io as $(GHCR_OWNER)...$(NC)\n"
	@printf "$$GITHUB_TOKEN" | docker login ghcr.io -u $(GHCR_OWNER) --password-stdin
	@printf "$(GREEN)✓ GHCR login OK$(NC)\n"

# ─── Docker build (developer / CI machine) ───────────────────────────────────
# Builds all images and tags each with both :latest and :GIT_SHA.
# Pass IMAGE_TAG=<tag> to override the named tag (default: latest).
# Pass GHCR_OWNER=<org> to target a different registry owner.
#
# Build args for admin and mobile come from the shell environment.
# Easiest on a developer machine:
#   set -a && source .env.production && set +d && make docker-build

docker-build: docker-build-api docker-build-admin docker-build-mobile docker-build-postfix
	@printf "$(BOLD)$(GREEN)✓ All images built — $(REGISTRY)/*:$(IMAGE_TAG) + :$(GIT_SHA)$(NC)\n"

docker-build-api:
	@printf "$(BLUE)Building API image...$(NC)\n"
	docker build --platform linux/amd64 \
		-t $(API_IMAGE):$(IMAGE_TAG) \
		-t $(API_IMAGE):$(GIT_SHA) \
		-f $(API_DIR)/Dockerfile \
		$(API_DIR)
	@printf "$(GREEN)✓ API image built$(NC)\n"

docker-build-admin:
	@printf "$(BLUE)Building admin-web image (VITE_API_URL=$(VITE_API_URL))...$(NC)\n"
	docker build --platform linux/amd64 \
		--build-arg VITE_API_URL="$(VITE_API_URL)" \
		--build-arg VITE_GOOGLE_LOGIN_URL="$(VITE_GOOGLE_LOGIN_URL)" \
		--build-arg VITE_MOBILE_PREVIEW_URL="$(VITE_MOBILE_PREVIEW_URL)" \
		-t $(ADMIN_IMAGE):$(IMAGE_TAG) \
		-t $(ADMIN_IMAGE):$(GIT_SHA) \
		-f $(ADMIN_DIR)/Dockerfile \
		$(ADMIN_DIR)
	@printf "$(GREEN)✓ Admin image built$(NC)\n"

docker-build-mobile:
	@printf "$(BLUE)Building mobile-web image (EXPO_PUBLIC_API_URL=$(EXPO_PUBLIC_API_URL))...$(NC)\n"
	docker build --platform linux/amd64 \
		--build-arg EXPO_PUBLIC_API_URL="$(EXPO_PUBLIC_API_URL)" \
		--build-arg EXPO_PUBLIC_SUPABASE_URL="$(EXPO_PUBLIC_SUPABASE_URL)" \
		--build-arg EXPO_PUBLIC_SUPABASE_KEY="$(EXPO_PUBLIC_SUPABASE_KEY)" \
		--build-arg EXPO_PUBLIC_MOBILE_API_KEY="$(EXPO_PUBLIC_MOBILE_API_KEY)" \
		-t $(MOBILE_IMAGE):$(IMAGE_TAG) \
		-t $(MOBILE_IMAGE):$(GIT_SHA) \
		-f $(MOBILE_DIR)/Dockerfile.prod \
		$(MOBILE_DIR)
	@printf "$(GREEN)✓ Mobile image built$(NC)\n"

docker-build-postfix:
	@printf "$(BLUE)Building postfix-relay image...$(NC)\n"
	docker build --platform linux/amd64 \
		-t $(POSTFIX_IMAGE):$(IMAGE_TAG) \
		-t $(POSTFIX_IMAGE):$(GIT_SHA) \
		ops/postfix
	@printf "$(GREEN)✓ Postfix image built$(NC)\n"

# ─── Docker push to GHCR ─────────────────────────────────────────────────────

docker-push:
	@printf "$(BLUE)Pushing images to $(REGISTRY)...$(NC)\n"
	docker push $(API_IMAGE):$(IMAGE_TAG)
	docker push $(API_IMAGE):$(GIT_SHA)
	docker push $(ADMIN_IMAGE):$(IMAGE_TAG)
	docker push $(ADMIN_IMAGE):$(GIT_SHA)
	docker push $(MOBILE_IMAGE):$(IMAGE_TAG)
	docker push $(MOBILE_IMAGE):$(GIT_SHA)
	docker push $(POSTFIX_IMAGE):$(IMAGE_TAG)
	docker push $(POSTFIX_IMAGE):$(GIT_SHA)
	@printf "$(BOLD)$(GREEN)✓ All images pushed to $(REGISTRY)$(NC)\n"

# Build + push in one step (use this in CI)
release: docker-build docker-push
	@printf "$(BOLD)$(GREEN)✓ Release complete — SHA: $(GIT_SHA)  tag: $(IMAGE_TAG)$(NC)\n"

# ─── Server deploy (run these ON the server) ─────────────────────────────────
# Full deploy: pull latest images → run migrations → restart containers
deploy: deploy-pull deploy-migrate deploy-up
	@printf "$(BOLD)$(GREEN)✓ Deploy complete$(NC)\n"

# Pull latest images from GHCR (does NOT restart running containers yet)
deploy-pull:
	@printf "$(BLUE)Pulling latest images from GHCR...$(NC)\n"
	$(COMPOSE_PROD) pull --ignore-pull-failures api worker admin-web mobile-web postfix-relay

# Run any pending database migrations
deploy-migrate:
	@printf "$(BLUE)Running database migrations...$(NC)\n"
	$(COMPOSE_PROD) run --rm --remove-orphans migrate

# Start / restart containers with the newly pulled images
deploy-up:
	@printf "$(BLUE)Starting production stack (detached)...$(NC)\n"
	$(COMPOSE_PROD) up -d --remove-orphans --wait

# Stop all containers
deploy-down:
	@printf "$(YELLOW)Stopping production stack...$(NC)\n"
	$(COMPOSE_PROD) down

# Tail live logs across all containers
deploy-logs:
	@$(COMPOSE_PROD) logs -f --tail=100

# Show container status and health
deploy-status:
	@$(COMPOSE_PROD) ps

# Roll back to a specific SHA:  make rollback SHA=abc1234
rollback:
	@[ -n "$(SHA)" ] || (printf "$(RED)Usage: make rollback SHA=<git-sha>$(NC)\n" && exit 1)
	@printf "$(YELLOW)Rolling back all services to SHA=$(SHA)...$(NC)\n"
	IMAGE_TAG=$(SHA) $(COMPOSE_PROD) pull --ignore-pull-failures api worker admin-web mobile-web postfix-relay
	IMAGE_TAG=$(SHA) $(COMPOSE_PROD) up -d --remove-orphans --wait
	@printf "$(GREEN)✓ Rolled back to $(SHA)$(NC)\n"

# git pull + full deploy — one command to update the server
update: pull deploy
	@printf "$(BOLD)$(GREEN)✓ Server fully updated$(NC)\n"

# ── Live log tailing (shorthand for deploy-logs) ─────────────────────────────
logs:
	@$(COMPOSE_PROD) logs -f --tail=100

# ── First SUPER_ADMIN bootstrap ───────────────────────────────────────────────
# Creates the first super-admin account directly in the database.
# Only use this once, before any admin user exists.
# Usage: make setup-admin EMAIL=you@example.com NAME="Your Name" PASSWORD=yourpassword
setup-admin:
	@if [ -z "$(EMAIL)" ] || [ -z "$(NAME)" ] || [ -z "$(PASSWORD)" ]; then \
	  printf "$(RED)Usage: make setup-admin EMAIL=you@example.com NAME=\"Your Name\" PASSWORD=yourpass$(NC)\n"; \
	  exit 1; \
	fi
	@printf "$(BLUE)Creating SUPER_ADMIN: $(EMAIL)...$(NC)\n"
	@$(COMPOSE_PROD) exec api node -e " \
	  const { Pool } = require('pg'); \
	  const bcrypt = require('bcryptjs'); \
	  (async () => { \
	    const pool = new Pool({ connectionString: process.env.DATABASE_URL }); \
	    const existing = await pool.query(\"SELECT id FROM app_users WHERE role = 'SUPER_ADMIN' LIMIT 1\"); \
	    if (existing.rowCount > 0) { console.error('A SUPER_ADMIN already exists. Use the invite flow for additional admins.'); process.exit(1); } \
	    const hash = await bcrypt.hash('$(PASSWORD)', 12); \
	    await pool.query( \
	      \"INSERT INTO app_users (email, password_hash, display_name, role, email_verified_at, is_active) VALUES (\\\$$1,\\\$$2,\\\$$3,'SUPER_ADMIN',NOW(),true)\", \
	      ['$(EMAIL)', hash, '$(NAME)'] \
	    ); \
	    console.log('SUPER_ADMIN created successfully.'); \
	    await pool.end(); \
	  })().catch(e => { console.error(e.message); process.exit(1); }); \
	"
	@printf "$(GREEN)✓ SUPER_ADMIN '$(EMAIL)' created. Sign in at your admin panel.$(NC)\n"

# ── Legacy container cleanup ──────────────────────────────────────────────────
# Removes old claudygod_* containers that predate the current production stack.
# Safe to run — will not touch wisdom_*, shared_*, or claudygod-production-* containers.
clean-legacy:
	@printf "$(YELLOW)Stopping legacy ClaudyGod containers...$(NC)\n"
	@docker stop claudygod_api claudygod_web claudygod_redis claudygod_grafana 2>/dev/null || true
	@docker rm   claudygod_api claudygod_web claudygod_redis claudygod_grafana 2>/dev/null || true
	@printf "$(GREEN)✓ Legacy containers removed$(NC)\n"
	@printf "$(BLUE)Restarting production API so Traefik refreshes routing...$(NC)\n"
	@$(COMPOSE_PROD) restart api worker
	@printf "$(GREEN)✓ Production API restarted — routing is clean$(NC)\n"

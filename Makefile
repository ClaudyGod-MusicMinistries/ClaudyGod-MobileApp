# ============================================================
#  ClaudyGod — Monorepo Makefile
#  Package manager: yarn (--cwd for per-workspace commands)
# ============================================================

MOBILE_DIR  := apps/mobile
API_DIR     := services/api
ADMIN_DIR   := admin/web

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
	status pull push

# ─── Help ────────────────────────────────────────────────────────────────────

help:
	@printf "$(BOLD)$(BLUE)╔══════════════════════════════════════════════╗$(NC)\n"
	@printf "$(BOLD)$(BLUE)║        ClaudyGod Monorepo Commands           ║$(NC)\n"
	@printf "$(BOLD)$(BLUE)╚══════════════════════════════════════════════╝$(NC)\n"
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
		cp .env.development.example .env.development; \
		printf "$(GREEN)✓ .env.development created from example$(NC)\n"; \
	else \
		printf "$(YELLOW)⚠ .env.development already exists — skipping$(NC)\n"; \
	fi

hooks-install:
	@printf "$(BLUE)Installing lefthook git hooks...$(NC)\n"
	yarn hooks:install
	@printf "$(GREEN)✓ Git hooks installed$(NC)\n"

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

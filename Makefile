.PHONY: help install setup dev build test lint clean mobile-install mobile-start mobile-build mobile-lint

# Colors for output
BLUE=\033[0;34m
GREEN=\033[0;32m
YELLOW=\033[0;33m
RED=\033[0;31m
NC=\033[0m # No Color

help:
	@echo "$(BLUE)=== ClaudyGod Make Commands ===$(NC)"
	@echo ""
	@echo "$(GREEN)Installation & Setup$(NC)"
	@echo "  make install           Install all dependencies"
	@echo "  make setup             Full project setup (install + build)"
	@echo ""
	@echo "$(GREEN)Development$(NC)"
	@echo "  make dev               Start development server"
	@echo "  make dev-web           Start web development"
	@echo "  make dev-ios           Start iOS development"
	@echo "  make dev-android       Start Android development"
	@echo ""
	@echo "$(GREEN)Building$(NC)"
	@echo "  make build             Build for all platforms"
	@echo "  make build-web         Build web bundle"
	@echo "  make build-ios         Build iOS app"
	@echo "  make build-android     Build Android APK"
	@echo ""
	@echo "$(GREEN)Code Quality$(NC)"
	@echo "  make lint              Run ESLint"
	@echo "  make lint-fix          Fix linting issues"
	@echo "  make typecheck         Run TypeScript check"
	@echo "  make test              Run test suite"
	@echo ""
	@echo "$(GREEN)Utilities$(NC)"
	@echo "  make clean             Clean build artifacts"
	@echo "  make clean-all         Clean everything (node_modules, dist, etc)"
	@echo "  make logs              Show app logs"
	@echo ""

# Installation & Setup
install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install
	cd apps/mobile && npm install
	cd services/api && npm install
	cd admin/web && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

setup: install
	@echo "$(BLUE)Running setup...$(NC)"
	@echo "$(GREEN)✓ Setup complete$(NC)"

# Development
dev:
	@echo "$(BLUE)Starting development server...$(NC)"
	cd apps/mobile && npm start

dev-web:
	@echo "$(BLUE)Starting web development...$(NC)"
	cd apps/mobile && npm run web

dev-ios:
	@echo "$(BLUE)Starting iOS development...$(NC)"
	cd apps/mobile && npm run ios

dev-android:
	@echo "$(BLUE)Starting Android development...$(NC)"
	cd apps/mobile && npm run android

# Building
build:
	@echo "$(BLUE)Building app...$(NC)"
	cd apps/mobile && npm run build

build-web:
	@echo "$(BLUE)Building web...$(NC)"
	cd apps/mobile && npm run web

build-ios:
	@echo "$(BLUE)Building iOS...$(NC)"
	cd apps/mobile && npm run ios

build-android:
	@echo "$(BLUE)Building Android...$(NC)"
	cd apps/mobile && npm run android

# Code Quality
lint:
	@echo "$(BLUE)Running linter...$(NC)"
	cd apps/mobile && npm run lint

lint-fix:
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	cd apps/mobile && npm run lint:fix

typecheck:
	@echo "$(BLUE)Running TypeScript check...$(NC)"
	cd apps/mobile && npm run typecheck

test:
	@echo "$(BLUE)Running tests...$(NC)"
	cd apps/mobile && npm test

# Utilities
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	cd apps/mobile && rm -rf .expo dist build
	@echo "$(GREEN)✓ Cleaned$(NC)"

clean-all: clean
	@echo "$(BLUE)Removing all dependencies and artifacts...$(NC)"
	cd apps/mobile && rm -rf node_modules
	cd services/api && rm -rf node_modules
	cd admin/web && rm -rf node_modules
	rm -rf node_modules
	@echo "$(GREEN)✓ All cleaned$(NC)"

logs:
	@echo "$(BLUE)Showing app logs...$(NC)"
	cd apps/mobile && npm start -- --verbose

# Mobile specific targets
mobile-install:
	@echo "$(BLUE)Installing mobile dependencies...$(NC)"
	cd apps/mobile && npm install
	@echo "$(GREEN)✓ Mobile dependencies installed$(NC)"

mobile-start:
	@echo "$(BLUE)Starting mobile app...$(NC)"
	cd apps/mobile && npm start

mobile-build:
	@echo "$(BLUE)Building mobile app...$(NC)"
	cd apps/mobile && npm run build

mobile-lint:
	@echo "$(BLUE)Linting mobile code...$(NC)"
	cd apps/mobile && npm run lint

# Docker targets (if needed)
docker-build:
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t claudygod:latest .

docker-run:
	@echo "$(BLUE)Running Docker container...$(NC)"
	docker run -p 8082:8082 claudygod:latest

# Git helpers
status:
	@echo "$(BLUE)Git status:$(NC)"
	git status

push:
	@echo "$(BLUE)Pushing to repository...$(NC)"
	git push origin main

pull:
	@echo "$(BLUE)Pulling from repository...$(NC)"
	git pull origin main

# Default target
.DEFAULT_GOAL := help

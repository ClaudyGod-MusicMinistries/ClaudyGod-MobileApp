# Environment Configuration Guide

## Overview

This guide explains how to configure the ClaudyGod application stack for different environments (development, staging, production) **without any hardcoded values**.

All sensitive data, service endpoints, and configuration is managed through environment variables, not code.

## Quick Start

### For Local Development

```bash
# 1. Navigate to services/api
cd services/api

# 2. Copy the environment template
cp .env.example .env

# 3. Edit .env with your local values
nano .env

# 4. Required for local development:
NODE_ENV=development
DATABASE_URL=postgresql://admin:password@localhost:5432/claudygod_dev
SMTP_HOST=localhost
SMTP_PORT=1025  # Mailhog for local testing
API_PORT=3000
```

### For Docker Compose (Local)

```bash
# Use the docker-compose.local.yml which comes with sensible defaults
# Set these environment variables before running:

export DATABASE_URL="postgresql://postgres:postgres@db:5432/claudygod"
export SMTP_HOST="mailhog"
export REDIS_URL="redis://redis:6379"

docker-compose -f docker-compose.local.yml up
```

## Environment Tiers

### Development Environment

**Purpose**: Local machine development and testing

**Configuration File**: `services/api/.env.development`

**Key Settings**:
```env
NODE_ENV=development
DEBUG=true
DEVELOPMENT_MODE=true
LOG_LEVEL=debug
DATABASE_SSL_MODE=disable
SEED_DATABASE_ON_START=true
MOCK_EXTERNAL_SERVICES=false
```

**Database**: Local PostgreSQL (Docker Compose)
**Email**: Mailhog SMTP server (Docker Compose port 1025)
**Cache**: Local Redis (Docker Compose)

### Staging Environment

**Purpose**: Pre-production testing, QA validation

**Configuration File**: `.env.staging` (on deployment server)

**Key Settings**:
```env
NODE_ENV=staging
DEBUG=false
DEVELOPMENT_MODE=false
LOG_LEVEL=info
DATABASE_SSL_MODE=require
SEED_DATABASE_ON_START=false
MOCK_EXTERNAL_SERVICES=false
```

**Database**: Staging PostgreSQL server with backups
**Email**: Real SMTP server (Gmail, SendGrid, or custom)
**Cache**: Staging Redis instance
**Monitoring**: Sentry error tracking enabled

### Production Environment

**Purpose**: Live application, real users

**Configuration File**: Managed by deployment system (not in repo)

**Key Settings**:
```env
NODE_ENV=production
DEBUG=false
DEVELOPMENT_MODE=false
LOG_LEVEL=warn
DATABASE_SSL_MODE=require
SEED_DATABASE_ON_START=false
MOCK_EXTERNAL_SERVICES=false
HTTPS_ONLY=true
CORS_ORIGINS=https://claudygod.com
```

**Database**: Production PostgreSQL with replication
**Email**: Production SMTP with SPF/DKIM/DMARC
**Cache**: Production Redis Cluster
**Monitoring**: Full Sentry, CloudWatch, custom metrics

## Key Configuration Categories

### 1. Database Configuration

```env
# Connection string with all components
DATABASE_URL=postgresql://user:password@host:port/database

# Connection pooling
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# SSL/TLS security
DATABASE_SSL_MODE=require  # require in production, disable in dev
```

**Important Notes**:
- Never commit actual DATABASE_URL to repository
- Use `.env` file (git ignored)
- Rotate database password every 90 days
- In production, use AWS RDS or similar managed service

### 2. Email Configuration (No Hardcoding)

Instead of hardcoding email settings in code:

```typescript
// ❌ WRONG - Hardcoded values
const emailConfig = {
  from: 'noreply@claudygod.com',  // Hardcoded!
  smtp: {
    host: 'mail.google.com',       // Hardcoded!
    user: 'app@gmail.com',         // Hardcoded!
  }
};

// ✅ CORRECT - Environment driven
const emailConfig = {
  from: process.env.EMAIL_FROM_ADDRESS,
  smtp: {
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
  }
};
```

**Environment Variables Required**:
```env
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=secure-password
EMAIL_FROM_NAME=ClaudyGod
EMAIL_FROM_ADDRESS=noreply@claudygod.com
SUPPORT_EMAIL_ADDRESS=support@claudygod.com
```

### 3. Authentication & Security

```env
# JWT Configuration
JWT_SECRET=random-secret-32-chars-minimum
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Password Policy
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
```

**Important**:
- Generate JWT_SECRET with: `openssl rand -base64 32`
- Rotate JWT_SECRET every 30 days
- Never log JWT_SECRET
- Use AWS Secrets Manager in production

### 4. Service URLs and Integration Points

```env
# Application URLs
APP_URL=https://claudygod.com
FRONTEND_URL=https://claudygod.com
API_BASE_URL=https://api.claudygod.com

# Cache & Session Store
REDIS_URL=redis://:password@host:6379
SESSION_STORE=redis

# File Storage
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=claudygod-media

# Error Tracking
SENTRY_ENABLED=true
SENTRY_DSN=https://...@sentry.io/...
```

## Validation & Startup

### Environment Validation

Before the application starts, all environment variables are validated:

```bash
# Validate environment configuration
npm run test:env

# Output example:
# ✓ NODE_ENV: valid
# ✓ DATABASE_URL: valid
# ✓ JWT_SECRET: valid (32+ chars)
# ✓ SMTP_HOST: valid (DNS lookup success)
# ✗ MISSING: AWS_ACCESS_KEY_ID
# ✗ MISSING: AWS_SECRET_ACCESS_KEY
```

### Startup Sequence

1. Load environment variables from `.env` file
2. Validate all required variables exist
3. Validate variable format (URLs, numbers, etc.)
4. Test critical connections (database, Redis, SMTP)
5. Initialize services with validated config
6. Start application only if all checks pass

## Docker Deployment

### Building Docker Images

```dockerfile
# Dockerfile uses build arguments for configuration
FROM node:18-alpine
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
```

### Running Docker Container

```bash
# Pass environment variables to Docker
docker run \
  -e DATABASE_URL="postgresql://..." \
  -e SMTP_HOST="mail.example.com" \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV="production" \
  claudygod-api:latest

# Or use environment file
docker run --env-file .env.production claudygod-api:latest

# Or with docker-compose
docker-compose -f docker-compose.production.yml up
```

### Docker Compose Override

```yaml
# docker-compose.production.yml
version: '3.8'
services:
  api:
    image: claudygod-api:1.0.0
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"
```

## Kubernetes Deployment

### ConfigMap for Non-Sensitive Config

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: claudygod-config
data:
  NODE_ENV: "production"
  API_PORT: "3000"
  LOG_LEVEL: "info"
  SMTP_HOST: "mail.example.com"
  SMTP_PORT: "587"
  CORS_ORIGINS: "https://claudygod.com"
```

### Secret for Sensitive Data

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: claudygod-secrets
type: Opaque
stringData:
  DATABASE_URL: postgresql://user:pass@host:5432/db
  SMTP_PASSWORD: your-password
  JWT_SECRET: your-secret-key
  AWS_SECRET_ACCESS_KEY: aws-secret
```

### Pod Configuration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: claudygod-api
spec:
  containers:
  - name: api
    image: claudygod-api:1.0.0
    envFrom:
    - configMapRef:
        name: claudygod-config
    - secretRef:
        name: claudygod-secrets
```

## CI/CD Pipeline Configuration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t claudygod-api:${{ github.sha }} .
      
      - name: Deploy with environment variables
        run: |
          docker run \
            -e DATABASE_URL=${{ secrets.PROD_DATABASE_URL }} \
            -e SMTP_HOST=${{ secrets.PROD_SMTP_HOST }} \
            -e SMTP_PASSWORD=${{ secrets.PROD_SMTP_PASSWORD }} \
            -e JWT_SECRET=${{ secrets.PROD_JWT_SECRET }} \
            claudygod-api:${{ github.sha }}
```

## Troubleshooting Configuration Issues

### Enable Debug Logging

```bash
# Set LOG_LEVEL to debug temporarily
export LOG_LEVEL=debug
npm start

# Output will show all environment variable loading steps
```

### Validate SMTP Connection

```bash
# Test email configuration
npm run test:email

# Attempts to:
# 1. Load SMTP config from env
# 2. Connect to SMTP server
# 3. Send test email
# 4. Report any issues
```

### Check Configuration Files

```bash
# View current environment
npm run show:env

# Shows:
# - All loaded environment variables
# - Which are from .env file
# - Which are from system environment
# - Validation status of each
```

## Security Best Practices

### Never in Version Control

❌ **Do NOT commit**:
- `.env` files
- `.env.production`
- `docker-compose.secret.yml`
- Private keys
- Passwords
- API keys / secrets

✅ **DO commit**:
- `.env.example` (template only)
- `docker-compose.yml` (non-secret config)
- `config/` directory (no secrets)

### Secret Management Tools

**Local Development**: Use `.env` file (git ignored)
**Staging/Production**: Use managed services:
- AWS Secrets Manager
- GCP Secret Manager
- Azure Key Vault
- HashiCorp Vault
- Kubernetes Secrets

### Regular Rotation

- **JWT Secret**: Every 30 days
- **Database Password**: Every 90 days
- **SMTP Password**: Every 90 days
- **AWS Keys**: Every 6 months
- **OAuth Tokens**: As per provider policy

## Environment Variable Reference

See `services/api/.env.example` for complete list and detailed descriptions of:
- Application settings
- Database configuration
- Email/SMTP settings
- Authentication tokens
- Rate limiting
- Logging
- Features flags
- And more...

## Additional Resources

- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) - System architecture
- [services/api/.env.example](./services/api/.env.example) - Complete env reference
- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - Email configuration details
- [Twelve-Factor App](https://12factor.net/) - Configuration principles

---

**Last Updated**: January 2024
**Version**: 1.0.0

# PRODUCTION_DEPLOYMENT.md

# Production Deployment Guide

Complete guide for deploying ClaudyGod to production with high availability, monitoring, and auto-scaling.

## Pre-Deployment Checklist

### Infrastructure
- [ ] Domain registered and configured (claudygod.com)
- [ ] SSL certificates obtained (auto-renewal configured)
- [ ] Cloud infrastructure provisioned (App Platform, Database, Redis, S3)
- [ ] VPC and security groups configured
- [ ] Backups and disaster recovery tested
- [ ] CDN configured for static assets
- [ ] Email/SMTP service configured (SendGrid, Postfix, etc.)

### Application
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code coverage ≥ 80%
- [ ] Linting and type checking clean
- [ ] Security audit completed
- [ ] Performance profiling completed
- [ ] Error tracking (Sentry) configured
- [ ] Analytics configured

### Documentation
- [ ] API documentation complete
- [ ] Runbook created
- [ ] Incident response procedures written
- [ ] Database migration scripts tested
- [ ] Rollback procedures documented

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (CloudFront)                        │
│                    (Static Assets + Images)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Load Balancer (ELB)                          │
│              (SSL Termination + Health Check)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼────┐          ┌───▼────┐          ┌───▼────┐
    │  API 1 │          │  API 2 │          │  API 3 │
    │(Container)        │(Container)        │(Container)
    └───┬────┘          └───┬────┘          └───┬────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼──────────┐  ┌─────▼──────┐  ┌─────────▼───┐
    │  PostgreSQL  │  │ Redis      │  │ Elasticsearch
    │   Primary    │  │ Cluster    │  │  (Log Mgmt)
    └───┬──────────┘  └────────────┘  └──────────────┘
        │
    ┌───▼──────────┐
    │  PostgreSQL  │
    │  Standby     │
    │ (Replica)    │
    └──────────────┘
```

## Step-by-Step Deployment

### 1. Prepare Database

```bash
# Run migrations
npm run db:migrate

# Seed initial data (if needed)
npm run db:seed

# Verify health
npm run db:health
```

### 2. Build and Push Docker Images

```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Push to registry
docker push ghcr.io/claudygod/api:latest
docker push ghcr.io/claudygod/admin:latest
```

### 3. Deploy with Docker Compose

```bash
# SSH into production server
ssh -i ~/.ssh/deploy_key production_user@prod.server.com

# Navigate to app directory
cd /var/claudygod

# Pull latest images
docker-compose -f docker-compose.production.yml pull

# Start services
docker-compose -f docker-compose.production.yml up -d

# Verify deployment
docker-compose ps

# Check logs
docker-compose logs -f api
```

### 4. Verify Deployment

```bash
# Health check
curl https://api.claudygod.com/api/health

# Database connectivity
curl https://api.claudygod.com/api/health | jq '.database'

# Cache connectivity
curl https://api.claudygod.com/api/health | jq '.redis'

# Email SMTP check
npm run test:email
```

### 5. Post-Deployment Tasks

```bash
# Warm up cache
npm run cache:warm

# Run smoke tests
npm run test:smoke

# Monitor logs
docker-compose logs -f --tail=100

# Check metrics
open https://metrics.claudygod.com/grafana
```

## Environment Variables

Required for production deployment (in `.env` file):

```bash
# === Application ===
NODE_ENV=production
API_PORT=3000
APP_URL=https://claudygod.com
FRONTEND_URL=https://claudygod.com

# === Database ===
DATABASE_URL=postgresql://user:pass@host:5432/claudygod
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=20
DATABASE_SSL_MODE=require

# === Cache ===
REDIS_URL=redis://:password@redis-cluster:6379
SESSION_STORE=redis

# === Authentication ===
JWT_SECRET=<32+ character random string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# === Email ===
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASSWORD=<SendGrid API Key>
EMAIL_FROM_ADDRESS=noreply@claudygod.com
SUPPORT_EMAIL_ADDRESS=support@claudygod.com

# === Monitoring ===
SENTRY_ENABLED=true
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info

# === Security ===
HTTPS_ONLY=true
CORS_ORIGINS=https://claudygod.com,https://app.claudygod.com
```

## Monitoring & Alerts

### Grafana Dashboards
- **API Dashboard**: Response times, error rates, throughput
- **Database Dashboard**: Connection pool, query times, replication lag
- **Infrastructure Dashboard**: CPU, memory, disk usage

### Alert Rules (Prometheus)

```yaml
# High Error Rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05

# Database Replication Lag
- alert: DatabaseReplicationLag
  expr: pg_stat_replication_write_lsn_bytes - pg_wal_lsn_bytes > 1e9

# Redis Memory Usage
- alert: HighRedisMemory
  expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9

# API Response Time (p95)
- alert: SlowAPI
  expr: histogram_quantile(0.95, http_request_duration_ms) > 1000
```

## Scaling Guide

### Horizontal Scaling

```bash
# Scale API instances in Docker Compose
docker-compose -f docker-compose.production.yml up -d --scale api=5
```

### Vertical Scaling

```bash
# Increase resources in docker-compose.production.yml
deploy:
  resources:
    limits:
      cpus: '1.0'          # Increased from 0.5
      memory: 1024M        # Increased from 512M
```

### Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_content_user_created ON content(userId, createdAt DESC);
CREATE INDEX idx_notifications_user_read ON notifications(userId, isRead, createdAt DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM content WHERE userId = $1 ORDER BY createdAt DESC LIMIT 20;
```

## Backup & Recovery

### Automated Backups

```bash
# Daily backup script (cron job)
0 2 * * * /var/claudygod/scripts/backup-database.sh

# Script content
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.production.yml \
  exec -T postgres \
  pg_dump -U claudygod claudygod > /backups/db_$DATE.sql
gzip /backups/db_$DATE.sql
aws s3 cp /backups/db_$DATE.sql.gz s3://claudygod-backups/
```

### Database Recovery

```bash
# Restore from backup
docker-compose -f docker-compose.production.yml \
  exec -T postgres \
  psql -U claudygod claudygod < backup.sql
```

## Rollback Procedure

If issues occur:

```bash
# Stop current deployment
docker-compose -f docker-compose.production.yml down

# Rollback to previous version
git checkout HEAD~1
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Verify
curl https://api.claudygod.com/api/health

# Notify team
# Send notification to Slack/PagerDuty
```

## Performance Tuning

### Database Connection Pool

```env
# Recommended for 5 API instances
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=30
```

### Cache Warming

```typescript
// Warm up Redis cache on startup
async function warmupCache() {
  const popularContent = await getTopContent(100);
  for (const item of popularContent) {
    await cache.set(`content:${item.id}`, item, 3600);
  }
}
```

### API Response Caching

```typescript
// Cache GET endpoints
router.get('/api/content', 
  cacheMiddleware(300), // 5 minute cache
  ContentController.list
);
```

## Security Hardening

### SSL/TLS
- [ ] Let's Encrypt certificates (auto-renew)
- [ ] HSTS enabled (Strict-Transport-Security)
- [ ] Perfect Forward Secrecy (TLS 1.2+)

### Application Security
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] CSRF protection active
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (input sanitization)

### Infrastructure Security
- [ ] VPC isolation
- [ ] Security groups restrict traffic
- [ ] SSH key-based auth only
- [ ] Firewall rules configured
- [ ] DDoS protection (CloudFlare)

## Incident Response

### High CPU/Memory

```bash
# Check what's using resources
docker stats

# Scale up
docker-compose -f docker-compose.production.yml up -d --scale api=5

# Check logs
docker-compose logs api | grep -i error
```

### Database Connectivity Issues

```bash
# Check database health
curl https://api.claudygod.com/api/health | jq '.database'

# Connect directly
docker-compose exec postgres psql -U claudygod claudygod

# Check replication
docker-compose exec postgres psql -U claudygod claudygod -c "SELECT * FROM pg_stat_replication;"
```

### Email Not Sending

```bash
# Check SMTP configuration
npm run test:email

# View postfix logs
docker-compose logs postfix

# Monitor mail queue
docker-compose exec postfix mailq
```

## Support & Documentation

- **API Documentation**: https://api.claudygod.com/docs
- **Status Page**: https://status.claudygod.com
- **Support Email**: support@claudygod.com
- **Incident Response**: See runbook.md

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Owner**: DevOps Team

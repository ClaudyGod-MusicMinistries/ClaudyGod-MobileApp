# ClaudyGod Email Configuration & Troubleshooting Guide

## Your Current Setup

✅ **Brevo SMTP Credentials**: Verified and correct
- Username: `a18467001@smtp-brevo.com`
- SMTP Host: `smtp-relay.brevo.com`
- Port: `587`
- TLS: Required (STARTTLS negotiation)
- Status: ACTIVE as of March 19, 2026

---

## Deployment Steps

### 1. **Build and Deploy Updated Code**

```bash
cd /root/Tech_projects_000/ClaudyGod-MobileApp/ClaudyGod-MobileApp

# Deploy with the enhanced email logging and health checks
npm run docker:prod:up
```

This will start:
- **API** - Queues emails to Redis
- **Worker** - Processes email queue (with new debug logging)
- **Postfix Relay** - Forwards to Brevo
- **Redis** - Job queue storage
- **PostgreSQL** - Database with email_jobs table

### 2. **Wait for Containers to Stabilize** (2-3 minutes)

```bash
# Watch deployment logs
docker compose --env-file .env.production -f docker-compose.production.yml logs -f
```

Wait for:
- ✅ `api` container to be healthy
- ✅ `worker` container to show `Worker started - SMTP enabled: true`
- ✅ `postfix-relay` container to be healthy

---

## Diagnostic Endpoints

Once deployed, use these endpoints to diagnose email issues:

### **1. System Health Check** (Public)

```bash
curl https://api.claudygod.org/health | jq '.smtp'
```

**Expected output when working:**
```json
{
  "enabled": true,
  "reachable": true,
  "reason": null,
  "provider": "Brevo SMTP"
}
```

**If SMTP shows `"unreachable": true`:**
- Check Brevo account is still active
- Verify credentials in `.env.production` are correct
- Check network connectivity from the server to `smtp-relay.brevo.com:587`

---

### **2. Email Queue Status** (Admin Only)

```bash
# Requires authentication token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.claudygod.org/v1/admin/email/diagnostics | jq
```

**Returns:**
```json
{
  "generatedAt": "2026-03-25T10:30:00Z",
  "transport": {
    "enabled": true,
    "provider": "brevo",
    "providerLabel": "Brevo SMTP",
    "reachable": true,
    "reason": null
  },
  "summary": {
    "pendingJobs": 0,
    "processingJobs": 0,
    "completedLast24Hours": 45,
    "failedLast24Hours": 0,
    "totalLast7Days": 250
  },
  "recentJobs": [
    {
      "id": 1234,
      "jobType": "auth_verify_email",
      "status": "completed",
      "recipients": ["user@example.com"],
      "createdAt": "2026-03-25T10:20:00Z",
      "processedAt": "2026-03-25T10:20:05Z"
    }
  ]
}
```

---

### **3. Send Test Email** (Admin Only)

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient": "test@example.com"}' \
  https://api.claudygod.org/v1/admin/email/test | jq
```

**Expected response:**
```json
{
  "message": "Test email queued for delivery",
  "recipient": "test@example.com",
  "jobId": 1235,
  "queuedAt": "2026-03-25T10:35:00Z"
}
```

Check the admin email/diagnostics endpoint again 10-30 seconds later. The `jobId` should show as `"completed"`.

---

## Common Issues & Solutions

### ❌ **SMTP Shows Unreachable**

**Symptoms:** Health endpoint shows `"reachable": false`

**Solutions:**

1. **Verify Brevo credentials are valid:**
   ```bash
   grep "POSTFIX_SMTP" .env.production
   ```
   Should show your full key (ends with `SjDHy`)

2. **Check Brevo account status:**
   - Log in to [Brevo dashboard](https://dashboard.brevo.com)
   - Verify SMTP key is "Active"
   - Regenerate key if needed and update `.env.production`

3. **Test network connectivity:**
   ```bash
   docker exec claudygod-production-api-1 \
     nc -zv smtp-relay.brevo.com 587
   ```

4. **Restart the worker:**
   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml restart worker
   ```

---

### ⏳ **Emails Queued But Not Sent**

**Symptoms:** `pendingJobs > 0` in diagnostics

**Solutions:**

1. **Check worker logs for errors:**
   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml logs worker | tail -50
   ```
   Look for authentication or connection errors.

2. **Verify Redis connection:**
   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml logs redis | tail -20
   ```

3. **Check database for failed jobs:**
   The `email_jobs` table will show failed emails with error messages:
   ```bash
   # Query via admin panel or directly on DB
   SELECT id, recipients, status, error, last_attempt_at 
   FROM email_jobs 
   WHERE status = 'failed' 
   LIMIT 5;
   ```

---

### 🔄 **Emails Keep Failing**

**Symptoms:** `failedLast24Hours > 0` in diagnostics

**Verify:**

1. **Brevo SMTP key is still active:**
   - Dashboard → SMTP & API → SMTP keys
   - Confirm key hasn't been disabled or regenerated

2. **Check for typos in `.env.production`:**
   ```bash
   # Exact format required:
   POSTFIX_SMTP_USERNAME=a18467001@smtp-brevo.com
   POSTFIX_SMTP_PASSWORD=xsmtpsib-c46e3da...SjDHy
   ```

3. **View specific failure details:**
   ```bash
   # From recentJobs in diagnostics endpoint
   # Look at the "error" field for each failed job
   ```

---

## What Happens When Email is Sent

```
User registers
    ↓
API creates auth token
    ↓
API calls queueVerificationEmail()
    ↓
Email job inserted into PostgreSQL email_jobs table
    ↓
BullMQ job added to Redis queue
    ↓
Worker picks up job from queue
    ↓
Worker fetches email_job from DB
    ↓
Worker calls sendEmail() via nodemailer
    ↓
Nodemailer connects to smtp-relay.brevo.com:587 with STARTTLS
    ↓
Nodemailer authenticates with a18467001@smtp-brevo.com:XSMTPSIB_KEY
    ↓
Email sent to Brevo's relay
    ↓
Brevo forwards to recipient's inbox
    ↓
Database marked as 'completed' with sent_message_id
```

---

## Monitoring Tips

### Check Recent Emails in Real-Time

```bash
# Watch worker logs (includes enhanced debug output)
docker compose --env-file .env.production -f docker-compose.production.yml logs -f worker 2>&1 | grep "email-worker"
```

Expected output:
```
[email-worker] Worker started - SMTP enabled: true, Provider: brevo
[email-worker] Sending email to user@example.com (Job #1234)
[email-worker] ✓ Email delivered (Job #1234, Message ID: <uuid@brevo>)
```

### Monitor SMTP Connection Health

```bash
# Every 30 seconds, check SMTP reachability
while true; do 
  curl -s https://api.claudygod.org/health | jq '.smtp | .reachable' && sleep 30
done
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Deploy | `npm run docker:prod:up` |
| View logs | `docker compose --env-file .env.production -f docker-compose.production.yml logs -f` |
| Check SMTP | `curl https://api.claudygod.org/health \| jq '.smtp'` |
| Email diagnostics | Requires auth token to `/v1/admin/email/diagnostics` |
| Send test email | Requires auth token, POST to `/v1/admin/email/test` |
| Stop all | `npm run docker:prod:down` |
| Restart worker | `docker compose --env-file .env.production -f docker-compose.production.yml restart worker` |

---

## Still Having Issues?

1. **Get the JWT token for admin calls:**
   - Sign in to your admin dashboard
   - Check browser DevTools → Application → Cookies → `claudygod_session`

2. **Check database directly:**
   - Verify `email_jobs` table exists
   - Look for recent entries with `status = 'failed'`
   - Read the `error` column for specific messages

3. **Review Brevo logs:**
   - [Brevo Dashboard](https://dashboard.brevo.com) → Activity → SMTP Activity
   - See if emails arrived or were bounced/rejected

4. **Enable verbose Docker logging:**
   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml logs worker --follow
   ```

---

**Last Updated:** March 25, 2026  
**Email System:** Brevo SMTP Relay → SendEmail Worker  
**Status:** Enhanced health checks and debug logging implemented

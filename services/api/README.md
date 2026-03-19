# Claudy Admin API

Node.js + TypeScript backend for the Claudy admin portal and mobile app content feed.

## Features
- JWT auth for admin dashboard and mobile users
- Email verification + password recovery endpoints
- Branded transactional email templates for verification, onboarding, password reset, and profile security alerts
- Content management endpoints (`/v1/content`)
- Redis + BullMQ workers (content + email)
- Email notification queue
- Supabase signed upload URL endpoints (admin + mobile)
- YouTube integration endpoints (preview + sync + mobile feed videos)
- PostgreSQL migrations and admin seed script

## Key Endpoints
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `GET /v1/auth/me`
- `POST /v1/auth/email/verify`
- `POST /v1/auth/email/verify/request`
- `POST /v1/auth/password/forgot`
- `POST /v1/auth/password/reset`
- `GET /v1/content/manage`
- `POST /v1/content`
- `PATCH /v1/content/:id/visibility`
- `GET /v1/youtube/videos` (admin auth)
- `POST /v1/youtube/sync` (admin auth)
- `GET /v1/mobile/content`
- `GET /v1/mobile/youtube/videos`
- `POST /v1/mobile/uploads/signed-url` (requires `x-mobile-api-key`)

## Environment
Set these in the repo root `.env.development` for local work or `.env.production` for deployment (do not commit secrets):
- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`
- `YOUTUBE_MAX_RESULTS`
- `AUTH_REQUIRE_EMAIL_VERIFICATION`
- `AUTH_PUBLIC_BASE_URL`
- `AUTH_VERIFY_EMAIL_PATH`
- `AUTH_RESET_PASSWORD_PATH`
- `AUTH_SIGN_IN_PATH`
- `AUTH_ACCOUNT_REVIEW_PATH`
- `AUTH_VERIFICATION_TOKEN_TTL_MINUTES`
- `AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES`
- `EMAIL_BRAND_NAME`, `EMAIL_SUPPORT_EMAIL`, `MAIL_FROM`, `MAIL_REPLY_TO`
- `SMTP_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`

SMTP notes:
- Production should use `SMTP_PROVIDER=postfix` and `SMTP_HOST=postfix-relay`, with the relay container forwarding mail to Brevo.
- Keep the real Brevo credentials in the Postfix env values: `POSTFIX_RELAY_HOST`, `POSTFIX_RELAY_PORT`, `POSTFIX_SMTP_USERNAME`, and `POSTFIX_SMTP_PASSWORD`.
- Direct Brevo SMTP from the API remains available for non-production fallback, but the production path should stay provider-agnostic behind Postfix.
- After updating the mail schema, rerun `npm run migrate` so `email_jobs` includes provider, template, and delivery tracking columns.

## Quick start
1. Create the repo root `.env.development`
2. Set `DATABASE_URL` to your Supabase Postgres connection string, set `DATABASE_SSL=true`, and add `SUPABASE_SERVICE_ROLE_KEY`
3. Replace the placeholder password in `DATABASE_URL` with your real Supabase database password from the Supabase dashboard
4. `npm install`
5. `npm run dev`
6. `npm run dev:worker`

Startup note:
- The API auto-runs migrations on boot.
- In development, `SEED_ADMIN_ON_BOOT=true` ensures the configured admin account exists automatically.
- You can still run `npm run migrate` and `npm run seed:admin` manually if you want explicit one-off control.

Production note:
- The repo now includes `docker-compose.production.yml` with Traefik at the edge, Redis for queues, the API and worker behind the proxy, the admin and mobile web apps as static nginx-served builds, and a Postfix relay container for transactional email delivery through Brevo.

Supabase note:
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` are not enough for backend table creation
- The backend now assumes Supabase Postgres is the intended database target, but it still needs the real Postgres password in `DATABASE_URL`
- The backend schema is created only in the Postgres instance referenced by `DATABASE_URL`
- The public app auth flow now uses the backend auth endpoints and transactional email pipeline by default

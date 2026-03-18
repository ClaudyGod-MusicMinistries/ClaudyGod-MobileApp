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
- Brevo SMTP is the default transactional email target in the root env files. Use `SMTP_PROVIDER=brevo`, `SMTP_HOST=smtp-relay.brevo.com`, and your Brevo SMTP credentials.
- If you place Postfix in front of Brevo later, switch `SMTP_PROVIDER=postfix` and point `SMTP_HOST` at your relay without changing the email template code.
- After updating the mail schema, rerun `npm run migrate` so `email_jobs` includes provider, template, and delivery tracking columns.

## Quick start
1. Create the repo root `.env.development`
2. Set `DATABASE_URL` to your Supabase Postgres connection string, set `DATABASE_SSL=true`, and add `SUPABASE_SERVICE_ROLE_KEY`
3. Replace the placeholder password in `DATABASE_URL` with your real Supabase database password from the Supabase dashboard
4. `npm install`
5. `npm run migrate`
6. `npm run seed:admin`
7. `npm run dev`
8. `npm run dev:worker`

Supabase note:
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` are not enough for backend table creation
- The backend now assumes Supabase Postgres is the intended database target, but it still needs the real Postgres password in `DATABASE_URL`
- The backend schema is created only in the Postgres instance referenced by `DATABASE_URL`
- Mobile users are mirrored into `app_users`, `user_profiles`, and `user_preferences` after the API can verify their Supabase session with `SUPABASE_SERVICE_ROLE_KEY`

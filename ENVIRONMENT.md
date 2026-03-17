# Environment Setup

This repo now uses one root environment file per runtime mode:

- `.env.development` for local development, Docker, and device testing
- `.env.production` for production deployment

Mode selection is controlled by the runtime:

- local work defaults to development
- production should run with `NODE_ENV=production` or `CLAUDYGOD_ENV=production`

All three applications read from the repo root:

- `services/api` loads the root env file directly
- `admin/web` reads the root env file through Vite `envDir`
- `apps/mobile` reads the root env file through `app.config.js`

## Required workflow

1. Keep secrets only in the root `.env.development` and `.env.production`
2. Do not recreate package-level env files inside `apps/mobile`, `admin/web`, or `services/api`
3. Mirror the production values into your deployment platform and EAS environment

## Key groups

- Admin web: `VITE_API_URL`, `VITE_GOOGLE_LOGIN_URL`, `VITE_MOBILE_PREVIEW_URL`
- Mobile: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`, `EXPO_PUBLIC_EAS_PROJECT_ID`
- API and workers: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `MOBILE_API_KEY`
- Integrations: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_*`, `YOUTUBE_*`

## Supabase-backed tables

- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` only configure mobile auth and client access
- Backend tables are created in whatever Postgres instance `DATABASE_URL` points to
- If you want `app_users`, `content_items`, `support_requests`, and the rest of the backend schema inside Supabase, set `DATABASE_URL` to your Supabase Postgres connection string and set `DATABASE_SSL=true`
- The API also needs `SUPABASE_SERVICE_ROLE_KEY` to verify Supabase bearer tokens, issue signed upload flows, and auto-provision backend user rows from mobile sessions
- After updating those values, run `npm --prefix ./services/api run migrate`

## Transactional email

- The API now uses a queued transactional email flow for welcome, verification, password reset, and profile security notices
- Brevo SMTP is the intended provider path: set `SMTP_PROVIDER=brevo`, `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_USER`, and `SMTP_PASS`
- `EMAIL_BRAND_NAME`, `MAIL_FROM`, `MAIL_REPLY_TO`, and `EMAIL_SUPPORT_EMAIL` control the branded email experience
- If you add a Postfix relay later, switch `SMTP_PROVIDER=postfix` and point `SMTP_HOST` at the relay host

## Deployment notes

- Local Docker uses `.env.development`
- Production should use `.env.production` values through your host, container platform, or CI secrets
- EAS builds should read the same production values from EAS environment variables rather than hardcoding them in `eas.json`
- After this email upgrade, rerun `npm --prefix ./services/api run migrate` so the `email_jobs` table gets the delivery-tracking columns
- For shared end-user testing, avoid the local Docker Postgres fallback and point `DATABASE_URL` at the same managed Postgres instance you will deploy against

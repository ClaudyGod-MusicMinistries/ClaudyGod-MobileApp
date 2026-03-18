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
- This repo is now structured for Supabase Postgres as the primary backend database target
- Set `DATABASE_URL` to your Supabase Postgres connection string and set `DATABASE_SSL=true`
- The Supabase project URL and publishable key do not include your Postgres password; you still need the real database password from Supabase project settings
- The API also needs `SUPABASE_SERVICE_ROLE_KEY` to verify Supabase bearer tokens, issue signed upload flows, and auto-provision backend user rows from mobile sessions
- The API now auto-runs migrations on boot against the configured `DATABASE_URL`
- After updating those values for the first time, you can still run `npm --prefix ./services/api run migrate` manually if you want an explicit migration pass before startup

## Transactional email

- The API now uses a queued transactional email flow for welcome, verification, password reset, and profile security notices
- Local Docker and production Docker now both route mail through the internal `postfix-relay` container
- Production should use the internal Postfix relay: set `SMTP_PROVIDER=postfix`, `SMTP_HOST=postfix-relay`, and keep the real Brevo relay credentials in `POSTFIX_SMTP_USERNAME` and `POSTFIX_SMTP_PASSWORD`
- Postfix then relays outbound mail to Brevo on `smtp-relay.brevo.com:587` without changing the application email code
- `EMAIL_BRAND_NAME`, `MAIL_FROM`, `MAIL_REPLY_TO`, and `EMAIL_SUPPORT_EMAIL` control the branded email experience
- Direct Brevo SMTP is still acceptable for development or emergency fallback, but production should route through Postfix so the application tier stays provider-agnostic

## Deployment notes

- Local Docker uses `.env.development`
- Production Docker now uses `docker-compose.production.yml` with Traefik as the public reverse proxy, Postfix as the internal SMTP relay, Redis for queues, and Supabase Postgres as the database target
- Production should use `.env.production` values through your host, container platform, or CI secrets
- EAS builds should read the same production values from EAS environment variables rather than hardcoding them in `eas.json`
- After this email upgrade, rerun `npm --prefix ./services/api run migrate` so the `email_jobs` table gets the delivery-tracking columns
- For shared end-user testing and deployment, keep `DATABASE_URL` pointed at the same Supabase Postgres instance you want your end users to use
- `SEED_ADMIN_ON_BOOT=true` in development will ensure the configured admin account exists whenever the API boots

# Production Deployment

This repo now has a dedicated production stack:

- `docker-compose.production.yml`
- `ops/caddy/Caddyfile`
- `ops/postfix/`

## What runs in production

- `caddy` terminates TLS and reverse-proxies public traffic
- `api` serves the backend on the internal network only
- `worker` processes content and email queues
- `redis` backs BullMQ queues and runtime jobs
- `postfix-relay` forwards transactional mail to Brevo
- `admin-web` serves the admin SPA
- `mobile-web` serves the Expo web export for browser testing and shared previews

Native iOS and Android releases should still be shipped through EAS and the app stores. Docker does not replace native mobile release builds.

## Required production secrets

Fill the repo root `.env.production` with real values before starting:

- `DATABASE_URL` with the real Supabase Postgres password
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_ACCESS_SECRET`
- `MOBILE_API_KEY`
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`
- `ACME_EMAIL`, `ADMIN_DOMAIN`, `API_DOMAIN`, `APP_DOMAIN`
- `POSTFIX_MYHOSTNAME`
- `POSTFIX_RELAY_HOST`, `POSTFIX_RELAY_PORT`
- `POSTFIX_SMTP_USERNAME`, `POSTFIX_SMTP_PASSWORD`

## Start the stack

```bash
npm run docker:prod:up
```

To inspect the rendered production compose:

```bash
npm run docker:prod:config
```

To follow logs:

```bash
npm run docker:prod:logs
```

To stop the stack:

```bash
npm run docker:prod:down
```

## DNS and routing

Point these DNS records to your production host:

- `ADMIN_DOMAIN`
- `API_DOMAIN`
- `APP_DOMAIN`

Caddy issues TLS certificates automatically using `ACME_EMAIL`.

## Email delivery path

The application sends transactional email through the internal relay:

`api/worker -> postfix-relay -> Brevo SMTP`

That keeps the API provider-agnostic while still using Brevo for delivery.

## Mobile release path

Use the EAS `production` profile for store builds:

```bash
cd apps/mobile
eas build --platform all --profile production
```

Set the same production env values in EAS secrets so the native builds use the same API and Supabase endpoints as the deployed backend.

# Claudy Admin Portal

Admin UI workspace (kept separate from mobile app code).

Backend logic is now split into the root `services/` folder so you can keep admin UI and API as separate repos if needed:

- `admin/` -> admin portal (web, compose, docs)
- `services/api/` -> backend API + worker (Express + TypeScript)
- `apps/mobile/` -> mobile app

## Quick start (Docker)

```bash
cd admin
docker-compose up --build
```

Services:
- Web UI: http://localhost:5173 (preview) or http://localhost:4173 (production preview)
- API: http://localhost:4000

## Environment

- `API_PORT` (default 4000)
- `API_HOST` (default 0.0.0.0)
- `WEB_PORT` (default 5173)
- `VITE_API_URL` (default http://localhost:4000)
- `VITE_GOOGLE_LOGIN_URL` (optional; enables "Continue with Google" in admin auth)

## Local (without Docker)

```bash
cd ../services/api && npm install && npm run dev
cd ../../admin/web && npm install && npm run dev -- --host
```

## Deploy

- Build images: `docker-compose build`
- Push to registry, then `docker stack deploy` or run compose on your target server.

## Administrator provisioning

Privileged accounts are invitation-only. Shared signup codes and role self-selection are disabled.

After migrations, create the first and only bootstrap Super Admin from a trusted terminal using deployment secrets:

```bash
CLAUDYGOD_BOOTSTRAP_ADMIN_EMAIL='owner@example.com' \
CLAUDYGOD_BOOTSTRAP_ADMIN_NAME='Platform Owner' \
CLAUDYGOD_BOOTSTRAP_ADMIN_PASSWORD='use-a-unique-14+-character-secret' \
yarn --cwd services/api admin:bootstrap
```

The command refuses to run if an active Super Admin already exists or the email belongs to another account. Remove the bootstrap password from the environment immediately afterward. At first sign-in, MFA enrollment is mandatory.

All later accounts are created from **Access requests → Invite team member**. Invitations are hashed in the database, expire automatically, are single-use, and can be revoked before acceptance. Only a Super Admin can grant or remove Admin authority.

## Data flow

- Admin UI uses authenticated `/v1/content/manage` workflows on the API
- API stores data in Postgres and exposes `/v1/*` endpoints
- Mobile app consumes these endpoints directly (or via your gateway)

## Google login and device registration contract

For enterprise login/session tracking, wire these backend endpoints in `services/api`:

- `GET /v1/auth/google/start` -> redirects to Google OAuth consent.
- `GET /v1/auth/google/callback` -> verifies Google identity, issues your API JWT, then redirects back to admin/mobile.
- `POST /v1/auth/device/register` -> stores device metadata after auth (`deviceId`, platform, model, appVersion, pushToken).
- `GET /v1/auth/devices` -> lists trusted devices for the current user.

Recommended production flow:

- Admin/mobile receives your API JWT from backend, not from frontend-generated tokens.
- Every login/register/google callback writes/updates a `user_devices` record.
- New devices can be marked untrusted and optionally require OTP/email confirmation.

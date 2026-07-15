# Operations Runbook

## Admin onboarding & `ADMIN_SIGNUP_CODE` rotation

`services/api` supports two ways to create an ADMIN/MODERATOR/CREATOR account:

1. **Invite-token flow (standing path)** — an existing SUPER_ADMIN/ADMIN sends an invite
   (`POST /v1/admin/invitations`), the recipient accepts it with a single-use token
   (`POST /v1/auth/invitations/accept`). This is tied to a specific email address and
   expires after `ADMIN_INVITE_TTL_HOURS`. Use this for all onboarding once the team
   has its first admins.
2. **Shared-code self-registration (bootstrap path only)** — `POST /v1/auth/register`
   with `role: 'ADMIN' | 'MODERATOR' | 'CREATOR'` plus `adminSignupCode` matching the
   `ADMIN_SIGNUP_CODE` env var (see `services/api/src/modules/auth/auth.service.ts`,
   `registerUser`). This is a shared secret, not tied to any individual — anyone who
   obtains the code can create a privileged account. It exists only so the very first
   admin(s) can be created before any invite-sender exists.

**Rotation procedure**: once the initial ADMIN account(s) exist and can send invites,
rotate `ADMIN_SIGNUP_CODE` in the production secret store to a new random value (or set
it to an empty string to disable the path entirely — `registerUser` throws
`AUTH_ADMIN_DISABLED` when the env var is unset). Do this promptly after initial
bootstrap; do not leave the original bootstrap code live indefinitely. Rely on the
invite-token flow for all onboarding after that point.

## Storage (S3-compatible) — admin media uploads

Admin image/audio/video uploads (`services/api/src/modules/admin/storage.service.ts`,
`storage.routes.ts`) go through a presigned-URL pipeline against **Supabase's
S3-compatible storage endpoint**, not raw AWS S3. The pipeline itself (request a
presigned PUT URL → client uploads directly to storage → confirm, which `headObject`s
the file to verify it landed) requires four env vars, all optional at the zod-schema
level but load-bearing at runtime:

- `SUPABASE_S3_ENDPOINT` — from Supabase dashboard → Settings → Storage → S3 Access.
  Format: `https://<project-ref>.storage.supabase.co/storage/v1/s3`.
- `SUPABASE_S3_REGION` — must match the region the Supabase project is hosted in.
- `SUPABASE_S3_ACCESS_KEY_ID` / `SUPABASE_S3_SECRET_ACCESS_KEY` — from the same
  dashboard page.
- `SUPABASE_STORAGE_BUCKET` — defaults to `mobile-uploads`; only needs to be set if
  using a different bucket name.

`env.S3_ENABLED` (`services/api/src/config/env.ts`) is `true` only when the endpoint,
access key, and secret are all non-empty. Every admin storage endpoint except session
listing calls `assertS3Configured()`, which 503s with `S3_NOT_CONFIGURED` the instant
`S3_ENABLED` is false — this is the exact error an admin sees as "S3 storage is not
configured on this server" when trying to upload.

**The most common way this breaks**: having real values in `.env.production` is not
enough by itself. `.dockerignore` excludes all `.env*` files from the build context, so
the running container only ever receives env vars that are explicitly passed through in
`docker-compose.production.yml`'s `x-backend-env` anchor (or `services/api/docker-compose.dev.yml`
for local Docker dev). If a new env var is added to `.env.production` without also
adding it to the compose file's environment block, the container never sees it —
exactly what happened with these four S3 vars until this was fixed. **Whenever you add
a new required env var, check both places.**

**Verifying it's actually wired up**: `GET /health` (and `GET /`) return a
`capabilities.s3` boolean (`services/api/src/modules/health/health.routes.ts`) reflecting
`env.S3_ENABLED` — check that before attempting a real upload, no admin-panel
trial-and-error needed. In production, `config/env.ts`'s startup validation also refuses
to boot if these vars are missing or still contain placeholder values (same treatment as
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`) — a misconfigured deploy fails loudly at
`docker compose up` rather than silently 503ing on the first upload attempt.

## `requireMobileApiKey` — not a security boundary

`services/api/src/middleware/requireMobileApiKey.ts` accepts either a matching
`x-mobile-api-key` header (native app builds) **or** a self-reported
`x-claudy-client-platform: web` header (web builds, which can't embed a secret in a
public bundle). The second path is trivially spoofable by any HTTP client — it is a
soft client-identification signal only.

Real authorization for every sensitive route comes from `authenticate` (validates the
bearer JWT) plus a role check via `hasMinRole`/`requireRole` from
`services/api/src/middleware/rbac.ts`. Do not add a new route that relies on
`requireMobileApiKey` alone to protect privileged data or actions — always pair it with
`authenticate` and the appropriate role gate.

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

## Production deployment (`.github/workflows/deploy.yml`)

Every push to `main` runs `quality` → `build-push` → `deploy` in sequence. `quality` and
`build-push` need no server access — they lint/typecheck/test and then build+push four
images to GHCR (`claudygod-api`, `claudygod-postfix`, `claudygod-admin`,
`claudygod-mobile`), tagged both `:latest` and `:<commit-sha>`. `deploy` is the only job
that touches the real VPS.

### One-time VPS setup (before the `deploy` job can succeed)

1. Docker + Docker Compose installed, Traefik already running with an external network
   named `traefik-public` (or whatever `TRAEFIK_PUBLIC_NETWORK` is set to).
2. A directory on the server (e.g. `/opt/claudygod`) containing a real `.env.production`
   — populated once, by hand, with real secrets (`DATABASE_URL`, `JWT_ACCESS_SECRET`,
   `SUPABASE_SERVICE_ROLE_KEY`, `API_DOMAIN`, etc. — see the `x-backend-env` block and
   each service's `build.args` in `docker-compose.production.yml` for the full list).
   **The deploy job refuses to run if this file is missing**, and never creates,
   downloads, or overwrites it — it is server-local, out of band, forever.
3. Docker logged in (or GHCR packages made public) so the server can pull
   `ghcr.io/claudygod-musicministries/*` images.

### GitHub repo configuration (Settings → Secrets and variables → Actions)

| Name | Type | Purpose |
| --- | --- | --- |
| `DEPLOY_SSH_HOST` | Secret | VPS hostname/IP |
| `DEPLOY_SSH_USER` | Secret | SSH user with docker permissions |
| `DEPLOY_SSH_KEY` | Secret | Private key for that user (no passphrase) |
| `DEPLOY_SSH_PORT` | Secret | SSH port (optional, defaults to 22) |
| `DEPLOY_APP_DIR` | Secret | Absolute path holding the compose file + `.env.production` |
| `DEPLOY_GHCR_TOKEN` | Secret | GitHub PAT (`read:packages`) so the VPS can `docker login ghcr.io` |
| `API_DOMAIN` | Variable | Public API hostname, used for the post-deploy health check |

### What `deploy` actually does, in order

1. Copies the repo's `docker-compose.production.yml` to the server (nothing else).
2. SSHes in, logs into GHCR, `docker compose pull`s every image at the new commit SHA,
   runs the one-shot `migrate` service, then `docker compose up -d --remove-orphans` for
   `redis postfix-relay api worker admin-web mobile-web`, then prunes images older than
   48h.
3. Polls `docker compose ps` until every container reports healthy (fails loudly with
   logs if any container doesn't recover within ~90s).
4. Curls the real public `https://$API_DOMAIN/health` from the Actions runner — this is
   the only step that actually proves DNS, TLS, and Traefik are routing live traffic, not
   just that the container itself is up.

### Rolling back

Images are tagged with the commit SHA, not just `:latest`, specifically so a bad deploy
can be reverted without rebuilding: SSH to the server and run
`IMAGE_TAG=<previous-good-sha> docker compose -f docker-compose.production.yml --env-file .env.production up -d`
in `DEPLOY_APP_DIR`. Re-running the `deploy` job for an older commit (via
`workflow_dispatch` on that ref) does the same thing through CI instead.

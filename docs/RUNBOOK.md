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

The deploy mechanism itself (SSH in, `git pull`, `make deploy`) is not new — it mirrors
what was already built and tested against production earlier in this repo's history
(see `git log -S VPS_HOST -- .github/workflows/deploy.yml`), just re-enabled with a
pre-flight secrets check and a public health-check step added on top.

### One-time VPS setup (before the `deploy` job can succeed)

1. Docker + Docker Compose installed, Traefik already running with an external network
   named `traefik-public` (or whatever `TRAEFIK_PUBLIC_NETWORK` is set to).
2. **A git clone of this repo** at `VPS_DEPLOY_PATH` (e.g. `/opt/claudygod`), on the
   `main` branch, with a real `.env.production` sitting alongside it — populated once, by
   hand, with real secrets (`DATABASE_URL`, `JWT_ACCESS_SECRET`,
   `SUPABASE_SERVICE_ROLE_KEY`, `API_DOMAIN`, etc. — see the `x-backend-env` block and
   each service's `build.args` in `docker-compose.production.yml` for the full list).
   `.env.production` is gitignored — it is server-local, out of band, forever, and the
   deploy job refuses to run if it's missing.
3. The VPS user (`VPS_USER`) needs both `git pull` access to this repo and docker
   permissions, plus `make` installed (the Makefile drives the actual deploy steps).
4. Docker logged in on the VPS (or GHCR packages made public) so it can pull
   `ghcr.io/claudygod-musicministries/*` images — `make deploy` on the CI side does this
   automatically via `GHCR_DEPLOY_TOKEN`.

### GitHub repo configuration (Settings → Secrets and variables → Actions)

| Name | Type | Purpose |
| --- | --- | --- |
| `VPS_HOST` | Secret | VPS hostname/IP |
| `VPS_USER` | Secret | SSH user with git + docker permissions |
| `VPS_SSH_KEY` | Secret | Private key for that user, **base64-encoded** (`base64 -i key_file`) |
| `VPS_PORT` | Secret | SSH port |
| `VPS_DEPLOY_PATH` | Secret | Absolute path to the repo's git clone on the VPS |
| `GHCR_DEPLOY_TOKEN` | Secret | GitHub PAT (`read:packages`) so the VPS can `docker login ghcr.io` |
| `API_DOMAIN` | Variable | Public API hostname, used for the post-deploy health check |

### What `deploy` actually does, in order

1. Verifies all of the above are configured — fails immediately with a clear message
   listing what's missing, rather than a cryptic downstream SSH/scp failure.
2. SSHes into the VPS and, at `VPS_DEPLOY_PATH`: confirms `.env.production` exists,
   `git pull origin main` (brings `docker-compose.production.yml` and the `Makefile`
   itself up to date), logs into GHCR, then `IMAGE_TAG=<commit-sha> make deploy` — which
   is `deploy-pull` (pull every image at that SHA) → `deploy-migrate` (one-shot `migrate`
   service) → `deploy-up` (`docker compose up -d --remove-orphans --wait`). The `--wait`
   flag already blocks on and fails the step if any container doesn't become healthy —
   there's no separate polling step in the workflow for this.
3. Curls the real public `https://$API_DOMAIN/health` from the Actions runner — this is
   the one check that actually proves DNS, TLS, and Traefik are routing live traffic, not
   just that a container is internally healthy.

### Rolling back

The Makefile already has a target for this — SSH to the server and run
`make rollback SHA=<previous-good-sha>` in `VPS_DEPLOY_PATH`. There's also
`make deploy-status` (container health), `make deploy-logs` / `make logs` (tail logs),
and `make clean-legacy` (remove stale pre-rename containers and restart api/worker so
Traefik's routing table refreshes — see the Makefile for what it actually touches before
running it).

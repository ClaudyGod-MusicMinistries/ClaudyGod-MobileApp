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

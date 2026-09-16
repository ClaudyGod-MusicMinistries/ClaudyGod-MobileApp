# ClaudyGod Admin & Services — Access Deep Dive

Date: 2026-09-09
Scope: `services/api` auth + RBAC, `admin/web` login/session, production wiring
Question answered: *"can admin / super-admin actually log in, and is this built for more than one user?"*

---

## 1. Verdict

**The admin is a proper multi-user system, not a one-user hack.** It has:

- 5 roles with a hierarchy — `CLIENT < CREATOR < MODERATOR < ADMIN < SUPER_ADMIN`
  (`services/api/src/modules/auth/auth.types.ts`).
- A capability model (`services/api/src/security/capabilities.ts`) — 20 capabilities
  mapped per role; every admin route checks a specific capability
  (`assertCapability`), not just "is admin".
- Admin **invitations** (`admin_invitations`) and public **access requests**
  (`admin_access_requests`) — a Super Admin invites/approves more admins from the
  panel (Users → Access Requests). Unlimited admins.
- bcrypt password hashing, account lockout, email OTP, TOTP-style MFA, refresh
  sessions, `security_audit_log` / `auth_activity_events`.
- `SUPER_ADMIN` protections — the last active one can't be demoted; only a Super
  Admin can grant/modify Admin or Super Admin.

So the architecture is sound. The reason a client "can't log in / can't see
anything" is a combination of an **operational gap** (no admin account was
created) and a **real product defect** (mandatory MFA with no onboarding path).

---

## 2. Findings

### A0 · No `SUPER_ADMIN` exists in production — operational **[most likely cause]**

The first Super Admin is created **only** by a manual one-time step:

- `make setup-admin EMAIL=… NAME="…" PASSWORD=…` (inline script in `Makefile`), or
- `yarn --cwd services/api admin:bootstrap:prod` with `CLAUDYGOD_BOOTSTRAP_ADMIN_EMAIL`
  / `_NAME` / `_PASSWORD` (`services/api/src/cli/bootstrapSuperAdmin.ts`).

Neither is in `make deploy` or `.github/workflows/deploy.yml` (which only does
pull → migrate → up). On a fresh deployment there is **no admin account at all**,
so there is nobody for the client to log in as.

Made worse by missing docs:
- `services/api/README.md:64` points at `admin/README.md` for the bootstrap
  instructions — **that file does not exist**.
- `.env.example` documents no `CLAUDYGOD_BOOTSTRAP_ADMIN_*` variables.

**Immediate fix:** on the VPS, in the deploy directory:
```
make setup-admin EMAIL=client@theirdomain.org NAME="Full Name" \
  PASSWORD='<14+ chars, with upper, lower, digit and symbol>'
```
Then log in immediately and follow A1.

### A1 · Mandatory MFA with zero onboarding — **product defect, the real wall**

Every privileged API surface is gated:
- `services/api/src/modules/admin/admin.routes.ts:60` — `adminRouter.use(requirePrivilegedMfa)`
- `services/api/src/modules/website/website.routes.ts:17` — same for all `/v1/website/*`
- also `/v1/admin/storage`, `/v1/admin/ads`, `/v1/admin/ai`, `/v1/admin/app-config`,
  `/v1/admin/word-of-day`, `/v1/admin/analytics`.

`services/api/src/middleware/requirePrivilegedMfa.ts:15-16`: any `CREATOR`+ user
whose session is not MFA-verified **and** who has `mfaEnabled = false` gets
**`403 MFA_ENROLLMENT_REQUIRED`**.

A brand-new Super Admin has `mfa_enabled = false`, so:
1. Login at `/login` **succeeds** (auth cookie set, `mfaRequired` is false).
2. Lands on `/choose-workspace`.
3. Opening **either** workspace (Mobile Studio `/dashboard`, Web Studio `/web`)
   fires `/v1/admin/*` or `/v1/website/*` → **403** on every call.
4. The admin SPA has **no handling for `MFA_ENROLLMENT_REQUIRED` or
   `MFA_VERIFICATION_REQUIRED`**:
   - `admin/web/src/api/client.ts` interceptor only special-cases `401`.
   - `admin/web/src/router/guards.ts` has no MFA logic.
   - No banner / redirect. The user just sees "Multi-factor authentication is
     required for privileged access" toasts everywhere and looks locked out.

**Undocumented escape hatch that does work:** manually navigate to `/security`
(Account Security) and click *Enable two-factor* — `/v1/auth/mfa/setup` is on
`mfaRouter` and is **not** behind `requirePrivilegedMfa`. Nothing in the locked
UI links there.

**Even after enrolling**, `/v1/auth/mfa/verify-setup` marks only the *refresh*
session MFA-verified (`markRefreshSessionMfaVerified`). The **access token** still
carries `mfaVerified: false` for up to `JWT_ACCESS_TTL` (5 min in prod). The
401-only interceptor won't refresh on the resulting `403 MFA_VERIFICATION_REQUIRED`,
so the panel stays broken for ~5 min unless the user hard-reloads.

### A2 · `getUserById` never returns `mfa_enabled` or `tier` — bug

`services/api/src/modules/auth/auth.service.ts:1176`:
```sql
SELECT id, email, display_name, role, created_at, email_verified_at
FROM app_users WHERE id = $1
```
No `mfa_enabled`, no `tier`. `toSafeUser` then always produces
`mfaEnabled: false` and `tier: 'free'`.

`getUserById` backs `GET /v1/auth/session` and `/v1/auth/me`
(`auth.routes.ts:101`), so **the admin session endpoint always reports
`mfaEnabled: false`** — even for an admin who has enrolled. Any future
"you need to enable MFA" nudge built from session data would be wrong, and the
Security page can't reflect true state from the session object.

### A3 · Two divergent Super-Admin bootstrap paths

| | `make setup-admin` (Makefile) | `bootstrapSuperAdmin.ts` (CLI) |
|---|---|---|
| Password complexity | ❌ none | ✅ 14+ chars, 4 classes |
| `ensureUserScaffold` (user_profiles + user_preferences rows) | ❌ skipped | ✅ |
| Advisory lock / audit log entry | ❌ | ✅ |
| `is_active` in the "already exists" check | ❌ | ✅ |

An admin created via `make setup-admin` has **no `user_preferences` row**;
`me.service.ts:240` (`readPreferences`) throws `NotFoundError` when the row is
missing (harmless for the admin panel today, latent for anything that reads
`/v1/me/preferences`). The two paths should collapse into one (`make setup-admin`
should just invoke the CLI).

### A4 · `authenticate` trusts JWT claims with no DB check — security, mitigated

`services/api/src/modules/auth/authIdentity.service.ts:134` —
`resolveAuthenticatedUser` on the access-token path is only
`verifyAccessToken(token)`. A deactivated (`is_active = false`), demoted, or
deleted admin keeps full access until the access token expires. `JWT_ACCESS_TTL`
is `5m` in `.env.example` (prod) which caps the window; `.env.development` uses
`1d`. Acceptable with the 5-minute prod TTL, but a DB `is_active` + current-role
check on `/v1/admin` and `/v1/website` would make revocation instant.

### A5 · Infra path — checked, appears correct

Admin SPA is built with `VITE_API_URL=/api` (`docker-compose.production.yml:404`)
and calls its own origin. `admin/web/nginx.conf:30` proxies `location /api/` to
`http://claudygod-mobile-api:4000` — a network alias of the `cgm-api` service on
the external `edge`/`traefik-public` network
(`docker-compose.production.yml` `cgm-api` → `networks.edge.aliases`), and
`admin-web` is on that same network. Cookies are `HttpOnly; Secure;
SameSite=Strict; Path=/` (`authSessionCookie.ts`) which is fine for a same-origin
setup.

Only failure mode here: if the deployed admin image was ever built with
`VITE_API_URL` pointing at a **cross-origin** absolute URL (e.g. the API's own
domain), `SameSite=Strict` cookies would never be sent back and every
post-login request would 401 → login loop. Verify the running admin container
serves assets that call `/api/...` (relative), not `https://api.../...`.

---

## 3. Recommended fixes (priority order)

1. **Unblock now (A0):** run `make setup-admin …` on the VPS, then hand-hold the
   client through `/security` → Enable two-factor.
2. **A1 — the durable fix.** In `admin/web`:
   - Response interceptor: on `403` with `code === 'MFA_ENROLLMENT_REQUIRED'`
     → route to `/security` in an "enroll to continue" mode; on
     `MFA_VERIFICATION_REQUIRED` → step-up (request email code) modal.
   - After `verifyMfaSetup` succeeds, call `refreshSession()` so the new
     `mfaVerified` claim loads immediately instead of after token expiry.
   - Persistent banner in `AdminShell`/`WorkspaceShell` for privileged users
     with `mfaEnabled === false`.
   - Optional: a router guard that sends a privileged, non-enrolled user
     straight to `/security` instead of `/choose-workspace`.
3. **A2:** add `COALESCE(mfa_enabled, FALSE) AS mfa_enabled, COALESCE(tier,'free') AS tier`
   to the `getUserById` SELECT and map them in `toSafeUser`.
4. **A3:** make `make setup-admin` delegate to `admin:bootstrap:prod`; create
   `admin/README.md`; document `CLAUDYGOD_BOOTSTRAP_ADMIN_*` in `.env.example`.
5. **A4:** DB `is_active`/role check in `authenticate` for `/v1/admin` +
   `/v1/website`, or drop `JWT_ACCESS_TTL` to ~2m.
6. **Deploy safety:** add a check (in `certifyIntegrations` or a post-deploy
   step) that at least one **active** `SUPER_ADMIN` exists, so a fresh
   environment fails loudly instead of silently shipping with no admin.

---

## 4. Correct first-login runbook (until A1/A3 land)

1. On the VPS, in the deploy dir: `make setup-admin EMAIL=… NAME="…" PASSWORD='…'`
   (password: ≥14 chars incl. upper, lower, digit, symbol).
2. Go to `https://<ADMIN_DOMAIN>/login`, sign in.
3. You'll land on **Choose workspace**. **Do not** open a workspace yet — the
   panels will 403.
4. Navigate directly to `https://<ADMIN_DOMAIN>/security`.
5. **Enable two-factor authentication**, confirm the emailed code, save the
   backup codes.
6. **Hard-reload the page** (or wait ~5 min) so the session picks up the
   MFA-verified state.
7. Now both workspaces work. Invite the rest of the team from
   **Users → Access requests / Invitations** — never share one login.

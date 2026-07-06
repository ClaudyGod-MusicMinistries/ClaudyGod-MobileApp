# Staged auth module — not wired into the live app yet

This is a complete, working auth flow (sign-in, sign-up, OTP/email verification,
forgot/reset password, account security, profile, dashboard) built against the Claudy
API's existing JWT/OAuth/MFA/biometric backend. It is **intentionally disconnected**
from the live app right now — `app/_layout.tsx` boots straight into `(tabs)` with no
auth gate — to keep first-time onboarding frictionless. This is a deliberate product
decision, not abandoned work, and it's staged here (not under `app/`, so Expo Router's
file-based routing can't reach it) to be reactivated incrementally.

## Reactivation batches

**Batch 0 (current)** — guest-first, no auth gate. Nothing here is wired up.

**Batch 1 — trigger: cross-device favorites sync.** Wire up `sign-in.tsx`,
`sign-up.tsx`, and `AuthContext.tsx` as an *optional, dismissible* prompt surfaced only
when a user taps "sync favorites" in the library — never a blocking gate at launch.
Uncomment `APP_ROUTES.auth.signIn` / `.signUp` in `util/appRoutes.ts` once real routes
exist under `app/`.

**Batch 2 — trigger: prayer wall submissions + donation receipts.** Add
`verify-email.tsx`, `email-otp.tsx`, `forgot-password.tsx`, `reset-password.tsx` for a
complete self-serve account flow. This is also when `app/settingsPage/Payment.tsx`
should start attaching receipts to a real authenticated user record.

**Batch 3 — trigger: push notification preferences + account security.** Add
`account-security.tsx`, `profile.tsx`, `dashboard.tsx`. Uncomment
`APP_ROUTES.profile` / `.accountSecurity` at this point.

**Invariant across every batch**: core content consumption (browse, play audio/video,
watch live sessions) never requires signing in. Auth stays additive and feature-gated.

## Known gap: `upload.tsx` / `useContentUpload.ts`

`upload.tsx` (and its `hooks/useContentUpload.ts` dependency) targeted
`POST /v1/mobile/uploads/signed-url`, which has been **removed** from the backend —
mobile end-users are not meant to request storage-write URLs directly; only admins
(via the separate `admin/web` panel) publish content. If a future batch ever needs
mobile-side upload again (e.g. profile photo self-upload), wire it to a purpose-built,
role-scoped endpoint rather than reviving the old one.

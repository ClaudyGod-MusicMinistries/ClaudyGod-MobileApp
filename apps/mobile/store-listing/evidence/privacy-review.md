# Privacy review — data-flow inventory

**Purpose:** the source of truth for the App Store *App Privacy* questionnaire and the
Google Play *Data safety* form. Keep this in sync with the code; update it before every
release that changes what data is handled.

**Last reviewed:** _(fill in date + reviewer)_
**App version reviewed:** _(fill in)_

---

## 1. Summary

- The app is **usable with no account**. A per-install anonymous identifier
  (`mobile_installations`, a hashed opaque token in `expo-secure-store`) scopes the
  guest experience.
- **No advertising SDKs, no location, no contacts, no photos/camera/microphone, no
  device advertising identifier, no third-party analytics SDKs.** (Verified: no
  `expo-location`, `expo-camera`, `expo-image-picker`, ad libraries, or analytics
  libraries in `apps/mobile/package.json`.)
- Optional sign-in (email/password or Google / Apple via Supabase) unlocks data
  export, cross-device sync, and full account deletion.
- Crash diagnostics (Sentry) are **user-toggleable** (Settings → "Crash diagnostics")
  and gated in one place (`lib/sentry.ts`).

## 2. Data collected — by category

| Data | Where stored | Linked to identity | Purpose | User can delete |
| --- | --- | --- | --- | --- |
| Install identifier (hashed token) | `mobile_installations` + device Secure Store | Device only (not a person) | Run the app without an account | Reinstall clears it |
| Listening history (content id, title, play count, last played, resume position) | `mobile_installation_history` | Device (guest) or account | Continue watching / listening, "recently played" | Settings → Reset recommendations (guest); account deletion |
| Milestone / activation events | `mobile_installation_events` | Device or account | Recommendations, onboarding state | Reset recommendations; account deletion |
| Personalization & notification toggles | `mobile_installations` | Device | Honour user preferences | Editable in Settings |
| Expo push token | `mobile_installation_push_tokens`, `user_devices` | Device or account | Deliver notifications the user opted into | Disable notifications; removes token |
| Referral code + share/join counts | `mobile_referrals` | Device | Referral programme | Account deletion / support request |
| Support request (email address, subject, message, category) | `support_requests` | Email address | Respond to the user's support request | Support request; account deletion |
| App rating + optional comment | `app_ratings` | De-associated on account deletion | Product feedback | — |
| Giving request (amount, currency, schedule, chosen method id) | `donation_intents` | De-associated on account deletion | Record a giving pledge; **no card/bank numbers are collected in the app** | — |
| **Account only:** email, display name, password hash, OAuth provider id | `app_users`, Supabase Auth | Account | Authentication | In-app account deletion (§4) |
| **Account only:** MFA secret (encrypted), trusted-device records, sessions | auth tables | Account | Account security | Account deletion |
| **Account only:** playback session position/duration | `user_playback_sessions` | Account | Listening stats, resume | Account deletion |
| Crash & performance diagnostics (device model, OS version, stack traces, breadcrumbs incl. HTTP status codes and in-app screen names) | Sentry (processor) | Not linked to a person by default (`sendDefaultPii` is off — no IP, no email attached) | Diagnose crashes | Turn off "Crash diagnostics" in Settings |

## 3. Third-party processors / SDKs

| Party | What it receives | Notes |
| --- | --- | --- |
| **Supabase** (auth) | Email, OAuth identifiers, session tokens | Only when the user chooses to sign in |
| **Sentry** (crash reporting) | Diagnostics in the table above | Gated by the user's diagnostics toggle; no PII attached by default |
| **Expo** (EAS) | Push token (for notification delivery); anonymous update checks (OTA) | — |
| **Google / Apple** (Sign in with…) | Standard OAuth handshake | Only if the user picks that sign-in method |
| **YouTube** (video embeds) | Standard YouTube IFrame embed behaviour inside the in-app player | The app does **not** send YouTube any account data; YouTube's own cookies/policies apply within the embed |
| **bible-api.com** (Word of the Day verse text) | Nothing user-specific — a fixed daily verse reference only | Read-only public API |

## 4. Account deletion (App Store 5.1.1(v) / Play)

- **Entry point:** Settings → Privacy & Security → "Delete my account".
- **Flow:** the user confirms with their name + a confirmation phrase → the request is
  **scheduled** `ACCOUNT_DELETION_GRACE_DAYS` (default 30) in the future → a confirmation
  email is sent → the user may **"Cancel deletion"** from the same screen any time before
  the date.
- **Execution:** a worker job (`processDueAccountDeletions`, hourly) permanently deletes
  the `app_users` row once the grace period elapses. Every `ON DELETE CASCADE` table is
  purged; `ON DELETE SET NULL` rows (audit logs, ratings) are de-associated. A minimal
  `account_deletion_audit` row (prior user id + timestamps, no personal data) is kept.
- **Guests** have no account; they use "Reset recommendations" to clear installation
  playback signals, and can file a support request for anything else.

## 5. Data the app does NOT collect

Location, precise or coarse · Contacts · Photos / video / audio from the device ·
Health or fitness · Financial account numbers or card details · Browsing history outside
the app · Device advertising identifier (IDFA/GAID) · Biometric data (Face ID / Touch ID
is handled entirely by the OS; the app only receives a yes/no result).

## 6. App Privacy questionnaire — suggested answers

- **Contact info → Email address:** Collected (support requests; account sign-in).
  Linked to identity. Used for App Functionality. Not used for tracking.
- **Identifiers → User ID:** Collected (account id; install id). Linked. App
  Functionality + Product Personalization. Not tracking.
- **Usage Data → Product Interaction:** Collected (listening history, milestones).
  Linked (account) / not linked (guest). App Functionality + Personalization. Not
  tracking.
- **Diagnostics → Crash Data / Performance Data:** Collected (Sentry). Not linked. App
  Functionality. Not tracking.
- **Purchases:** *Not* collected — no in-app purchase or payment. (Giving requests store
  an amount and a chosen completion method only.)
- **Tracking:** **No.** The app does not track users across apps/sites and includes no
  ATT prompt because it collects no data used for tracking.

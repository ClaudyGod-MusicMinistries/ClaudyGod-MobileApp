# ClaudyGod Mobile Deep Review

Date: 2026-07-27

## Product decision update

The initial review recommended completing the mobile authentication routes because live mobile code exposed them. The product decision is now explicit: the mobile application is account-free at market entry, while authentication and password recovery belong only to the private admin portal.

Implemented after the baseline review:

- Removed unfinished mobile authentication routes and entry points while preserving the authentication feature foundation for a planned product update.
- Removed visible mobile account prompts and sign-in-dependent messaging.
- Kept the current release experience account-neutral; the interface does not position users as guests.
- Added professional admin forgot-password and reset-password routes using the existing rate-limited API recovery contract.

This decision supersedes P0-01 and P1-01 below. P0-02 remains relevant only if dormant mobile session-capable service code is reintroduced into a user-facing mobile account flow.

## Executive assessment

The application has a useful foundation: Expo Router, shared design tokens, React Query, shared feed primitives, centralized local downloads, error reporting, theme support, responsive helpers, and strict TypeScript/lint checks. It is not release-ready as a world-class product yet.

The highest-risk problem is not visual polish. It is product completeness and contract integrity. Live code navigates to routes that do not exist, authentication is split across two account models, the entire app is replaced by an offline blockade despite supporting downloads, giving presents detailed payment choices that cannot complete a payment, and sensitive refresh/access tokens are persisted in AsyncStorage on native. Automated checks currently pass while missing these defects because route safety is bypassed and integration coverage is very small.

Current quality-gate result:

- TypeScript: pass
- ESLint: pass
- Jest: pass, 53 tests across only 6 test files
- Screen/component integration tests: effectively absent
- End-to-end tests: absent
- Accessibility automation: absent
- Performance budgets/profiling: absent
- Native visual validation in this review: not yet performed

## Severity model

- P0: security, data loss, crash, or core journey cannot complete; blocks release.
- P1: major dead end, misleading product behavior, inaccessible core journey, or severe reliability/performance issue; blocks premium release.
- P2: important consistency, maintainability, responsiveness, or degraded-state issue.
- P3: polish and optimization after core contracts are correct.

## P0 findings

### P0-01: Live navigation targets missing routes

`APP_ROUTES.auth.signIn`, `APP_ROUTES.auth.signUp`, and `APP_ROUTES.profile` point to `/sign-in`, `/sign-up`, and `/profile`, but there are no corresponding files in `apps/mobile/app`. The route source explicitly describes these as future work while live components navigate to them.

Evidence:

- `apps/mobile/util/appRoutes.ts:1-7,11-12,33`
- `apps/mobile/features/auth/useRequireMobileSession.ts:15`
- `apps/mobile/features/auth/sign-in.tsx:371`
- `apps/mobile/features/auth/sign-up.tsx:265`
- `apps/mobile/features/auth/profile.tsx:265`
- `apps/mobile/features/auth/dashboard.tsx:168`
- `apps/mobile/components/auth/AccountSheet.tsx:494,499`

Required fix: create real Expo Router wrappers for every supported route or remove every unsupported route and navigation action. Add a route-manifest test that fails when a canonical static route lacks a file. Remove `as never` route casts and type dynamic destinations.

Acceptance: cold launch, guest-to-sign-in, sign-up, password recovery, email verification, profile, security, sign-out, and Android hardware-back journeys all complete without an unmatched route.

### P0-02: Native auth tokens are stored in unencrypted AsyncStorage

Access and refresh tokens are serialized under `claudygod.mobile-auth-session.v1` through AsyncStorage. App sandboxing is not equivalent to secure credential storage. A separate trusted-device implementation already uses SecureStore, showing that the secure primitive is available.

Evidence:

- `apps/mobile/lib/authSessionStorage.ts:15-27,35-44`
- `apps/mobile/lib/trustedDevice.ts:66-73`

Required fix: use `expo-secure-store` on native for refresh/access credentials, define migration and invalidation behavior, use the strongest practical accessibility setting, and test corrupt/missing/migrated storage. Keep web credentials in secure HttpOnly cookies or memory according to the server contract.

Acceptance: no bearer or refresh credential is written to AsyncStorage, logs, analytics, crash breadcrumbs, URLs, or insecure browser storage.

### P0-03: Offline mode blocks downloaded content

The root layout replaces the entire navigation tree with `OfflineScreen` whenever connectivity is unavailable. Users cannot reach Library or play files deliberately downloaded for offline use.

Evidence:

- `apps/mobile/app/_layout.tsx:124-126`
- `apps/mobile/context/DownloadsContext.tsx:41-159`

Required fix: keep the navigation tree mounted, show a non-blocking offline banner/status, allow cached and downloaded content, disable only network-dependent actions, and queue or clearly reject mutations. Do not infer internet availability solely from a single transient network snapshot.

Acceptance: airplane-mode launch reaches Library, plays an existing download, permits deletion, explains unavailable online actions, and recovers without restarting.

### P0-04: Giving flow represents unavailable payment methods as selectable

The Giving screen lets users select currency, amount, frequency, and a “Payment method,” but Continue opens a coming-soon/contact modal. The review screen acknowledges that no processor is wired. This is a trust and conversion failure in a financial journey.

Evidence:

- `apps/mobile/app/settingsPage/Donate.tsx:293-301,309-342,358-459`
- `apps/mobile/app/settingsPage/Payment.tsx:75-83,98-111`

Required fix: either integrate a compliant payment provider end to end or replace the configurator with honest external giving instructions. Do not show transaction-review or “secure” completion language until a verifiable transaction exists. Add idempotency, receipt, cancellation, failure, pending, retry, currency, tax/legal, and support paths before enabling native payment.

Acceptance: every displayed method completes successfully in staging and has tested failure/retry/cancel states, or no method is displayed as actionable.

## P1 findings

### P1-01: Authentication architecture has two competing sources of truth

The mounted `UserAccountProvider` exposes user/sign-out state, while an unmounted `AuthProvider` separately exposes access token/authenticated state. The dashboard consumes `useAuth()` and would throw if routed because no `AuthProvider` is mounted.

Evidence:

- `apps/mobile/app/_layout.tsx:185-204`
- `apps/mobile/context/UserAccountContext.tsx:107-139`
- `apps/mobile/features/auth/AuthContext.tsx:21-72`
- `apps/mobile/features/auth/dashboard.tsx:119`

Required fix: establish one auth/session domain with one state machine: initializing, guest, authenticating, verification-required, authenticated, refreshing, expired, and error. All auth screens, API authorization, profile, and account sheet must consume it.

### P1-02: Global boot adds a forced 2.2-second delay

Every launch waits at least 2200 ms for a branded animation, even when fonts and cached data are ready. This directly damages time-to-interactive and makes repeat launches feel slow.

Evidence: `apps/mobile/app/_layout.tsx:70,84-90,120-122`.

Required fix: let native splash remain only while essential boot work completes, cap any first-run brand moment, skip it on warm/repeat launches, and measure p50/p95 time-to-interactive on representative low/mid/high devices.

### P1-03: Accessibility semantics are far below full coverage

Static inventory found about 176 Pressable/Touchable primitives but only 30 `accessibilityLabel`, 12 `accessibilityRole`, and 7 `accessibilityState` occurrences. Many icon buttons, selectable chips, switches, modal actions, media controls, and custom tab controls lack complete semantics.

Representative evidence:

- `apps/mobile/components/OfflineScreen.tsx:45-54`
- `apps/mobile/app/settingsPage/Donate.tsx:365-456`
- `apps/mobile/app/live/[sessionId].tsx:355-432`
- `apps/mobile/components/TabBar.tsx`
- `apps/mobile/components/media/VideoPlayer.tsx`
- `apps/mobile/components/media/AudioPlayer.tsx`

Required fix: define accessible primitives and audit every interaction for label, role, state/value, hint only where needed, hit target, focus order, modal focus containment/restoration, reduced motion, Dynamic Type, screen-reader announcements, contrast, keyboard, and TV focus.

### P1-04: Modal behavior is fragmented

There are three modal foundations (`ConfirmModal`, `BottomSheet`/`ActionSheet`, and direct React Native `Modal`) plus context-driven modal orchestration. Giving and Word of Day implement independent behavior. Consistent focus, backdrop, loading locks, safe-area padding, keyboard avoidance, dismissal, stacking, and accessibility cannot be guaranteed.

Evidence:

- `apps/mobile/components/ui/ConfirmModal.tsx`
- `apps/mobile/components/ui/BottomSheet.tsx`
- `apps/mobile/components/ui/ActionSheet.tsx`
- `apps/mobile/context/AppModalContext.tsx`
- `apps/mobile/components/modals/WordOfDayModal.tsx`
- `apps/mobile/app/settingsPage/Donate.tsx:309-342`

Required fix: define a single modal/sheet policy and primitives. Add destructive-action, async-action, keyboard, rotation, screen-reader, hardware-back, gesture, stacked-overlay, and rapid-open/close tests.

### P1-05: Root-level Word of Day can interrupt unrelated work

Two seconds after any tab becomes active, a once-daily modal can appear. It can interrupt search entry, media selection, settings changes, account sheets, or another overlay. It is marked shown before the user has meaningfully viewed it.

Evidence: `apps/mobile/app/_layout.tsx:92-108,163-171`.

Required fix: present it as an opt-in/home-only surface or queue it behind a centralized overlay coordinator after navigation and interaction are idle. Record shown/dismissed/read states separately.

### P1-06: Download implementation lacks resumability and lifecycle ownership

`createDownloadResumable` is created but its resume data/object is not persisted, `downloadAsync()` completion is trusted without validating returned URI/content, errors are swallowed, filenames use server-controlled extension and content ID, and cancellation/storage-pressure states are absent.

Evidence: `apps/mobile/context/DownloadsContext.tsx:87-143`.

Required fix: build a download manager with persisted jobs, cancellation/resume, free-space checks, safe filenames, integrity/content-type checks, authenticated URL refresh, background behavior, cleanup, explicit failure reasons, and telemetry.

### P1-07: Public “mobile API key” must not be treated as authentication

`EXPO_PUBLIC_MOBILE_API_KEY` is embedded into the client bundle and attached to requests. Any public client secret is extractable. Requiring it in production does not make mobile requests trusted.

Evidence:

- `apps/mobile/services/config.ts:9,19,42,168-170,197`
- `apps/mobile/services/apiClient.ts:72`

Resolution: removed the embedded key and its server middleware. Public discovery
routes are explicitly public; account and privileged routes continue to require JWT
authentication and role authorization. Abuse protection belongs at the server/edge,
not in a recoverable client secret.

### P1-08: External URLs are opened without validation or failure UX

Many content, support, social, policy, store, and video URLs call `Linking.openURL` directly without scheme allowlisting, `canOpenURL`, confirmation for untrusted content, or catch/feedback behavior.

Evidence includes `apps/mobile/components/media/VideoPlayer.tsx:397,409,593,678`, `apps/mobile/app/(tabs)/PlaySection.tsx:213`, and `apps/mobile/app/settingsPage/About.tsx:182`.

Required fix: centralize safe external navigation, allowlist schemes (`https`, intentional `mailto`/store schemes), reject unsafe/admin-supplied schemes, handle unsupported apps, and display actionable failure feedback.

### P1-09: Test suite does not protect user journeys

Only six files contain tests. There are no tests for auth UI, settings, giving, privacy deletion, downloads, notifications, live messaging, modals, tab navigation, media lifecycle, offline recovery, or deep links.

Required fix: add component integration tests plus Detox/Maestro native E2E for release-critical journeys. Route-manifest, accessibility, API-contract, and visual regression checks must be release gates.

## P2 findings

### Architecture and correctness

- Route casts (`as never`) suppress compiler guarantees across profile, settings, section, and player navigation. Replace them with Expo Router typed routes and validated server-driven route IDs.
- `BackToHomeButton` hardcodes `/(tabs)/home` instead of using `APP_ROUTES`, creating avoidable drift (`components/feed/BackToHomeButton.tsx:17`).
- API client version is hardcoded to `1.0.0` rather than derived from application config (`services/apiClient.ts:70`).
- Websocket default URL is hardcoded to `wss://api.claudygod.com/ws`, separate from environment resolution (`services/websocketService.ts:30`).
- API errors collapse unexpected failures to status 500 and discard root cause/context; cancellation is not distinguished from actual failures (`services/apiClient.ts:122-145`).
- Many storage/network catches are silent. Best-effort behavior is valid for some analytics, but user-owned downloads, preferences, and auth need observable error states.
- Account migration uses process-local locks and accepts cross-session duplicate events (`context/UserAccountContext.tsx:31-38`). Server operations should be idempotent.
- Production web API host derivation is based on hostname convention instead of explicit immutable deployment config (`services/config.ts:113-135`).

### Performance

- Several critical files are too large for safe ownership and render analysis: `VideoPlayer.tsx` 1023 lines, `contentService.ts` 815, `authService.ts` 779, `YouTubeAudioPlayer.tsx` 676, `profile.tsx` 630, `AccountSheet.tsx` 592, `settings.tsx` 588, and `AudioPlayer.tsx` 575.
- Many screen-level collections render with `.map()` inside ScrollViews. Bounded rails use FlashList, but live messages, settings sections, library grids, search discovery, and large admin-configured sections need virtualization thresholds and measurement.
- `BottomSheet` reads `Dimensions.get('window')` once at module load, so rotation, split-screen, and foldable changes can use stale height (`components/ui/BottomSheet.tsx:15`).
- Root provider depth is high and several contexts carry frequently changing state. Profile React DevTools commits and isolate player progress, downloads, auth, toast, modal, and theme updates so they do not rerender the whole tree.
- Media players need measured CPU, memory, battery, network, startup, buffering, background/foreground, interruption, and cleanup budgets. Code size alone makes regressions likely.
- Image policy needs explicit cache, decode-size, prefetch, placeholder, memory, and CDN transformation rules; raw React Native Image remains in several screens.

### UX and product consistency

- The product mixes “ClaudyGod,” “ClaudyGo,” and hardcoded domains/addresses across repository assets and services. Establish one naming/domain/content authority.
- A notification icon on Home navigates to Settings rather than a notification center (`app/(tabs)/home.tsx:319`). Either label it as settings/preferences or build the expected inbox.
- The app defaults theme state to dark before asynchronously loading preference, allowing a visible theme flash (`context/ThemeProvider.tsx:26-49`). Hydrate theme before first content paint.
- The app says guest mode works “fully” while account-only, live participation, synchronization, and other paths require sign-in. Audit every promise against actual capability.
- Payment, referral, rate, support, privacy requests, and social links depend on admin configuration/fallbacks. Each needs invalid, missing, offline, and unsupported-platform states.
- Several actions use success modals for low-consequence preference toggles, adding friction. Reserve modals for decisions/interruptions and use inline state/toasts for confirmations.
- Visual decoration relies heavily on circles, washes, gradients, and elevated cards across settings/feed surfaces. A premium operational app needs clearer hierarchy and less repeated decorative chrome; validate through real device screenshots rather than token inspection alone.

### Accessibility and international readiness

- There is no localization framework. UI copy, date/time, amounts, currency ordering, pluralization, and scripture references are embedded in English.
- Donation amounts are strings and currency display is concatenated rather than formatted with locale-aware currency APIs.
- Font scaling, long text, RTL, keyboard navigation, switch semantics, focus-visible styles, and reduced-motion behavior are not test-gated.
- Icon-only controls need semantic labels; selection groups need roles/state; validation errors need association and announcement; media progress needs adjustable values.

### Release and observability

- The package script named `check` collides with Yarn 1's built-in `yarn check`; `yarn check` attempted registry access instead of running project checks. Use an unambiguous script such as `quality` and make CI invoke `yarn run quality`.
- The checker prints “Your code is ready!” after typecheck/lint/unit tests even though it does not build native apps, verify routes, test E2E flows, inspect accessibility, or enforce coverage. Change the wording and expand the gate.
- No defined SLOs exist for crash-free sessions, ANR rate, startup, media start, search latency, API error rate, or download success.
- No explicit analytics taxonomy/consent validation was found for funnel and reliability measurement. Diagnostics preference must actually control non-essential telemetry.

## Screen and workflow inventory

Status below is code-review status, not a visual sign-off.

| Surface | Route | Main review result |
|---|---|---|
| Brand/entry | `/` | Duplicated redirect logic plus forced boot delay; test cold/warm/deep-link entry. |
| Home | `/(tabs)/home` | Broad state coverage; notification affordance is misleading; many mixed sections need visual/performance validation. |
| Music/player | `/(tabs)/player` | Delegates to PlaySection; core media lifecycle and accessibility are untested. |
| Videos | `/(tabs)/videos` | External fallback and mapped sections; validate playback transitions, overflow, empty filters, and long lists. |
| Library | `/(tabs)/library` | Favorites/history/downloads exist, but root offline blockade defeats the main offline promise. |
| Settings | `/(tabs)/settings` | Dense 588-line hub; auth/profile dead-route risk, duplicate notification hook instances, excessive confirmation overlays. |
| Live list | `/(tabs)/live` | Hidden from primary tab bar; confirm discoverability, scheduled/ended states, and timezone formatting. |
| Search | `/(tabs)/search` | Hidden from primary tab bar; validate keyboard, debounce/cancel, recent queries, no-result recovery, and screen-reader results announcement. |
| PlaySection | `/(tabs)/PlaySection` | Internal route with external URL escape; should be component/domain flow or intentionally typed screen. |
| Live detail | `/live/[sessionId]` | Comments/suggestions and media share one large screen; auth failure, reconnect, moderation, pagination, keyboard and message scaling need tests. |
| Dynamic section | `/section/[sectionId]` | Server/parameter-driven title and content; validate invalid ID, malicious/long params, deep link, and no-history back behavior. |
| Account security | `/account-security` | Real wrapper exists; protect auth initialization/expiry and destructive changes. |
| Email OTP | `/email-otp` | Real wrapper exists; test resend limits, paste/autofill, expiry, lockout, and backgrounding. |
| Forgot password | `/forgot-password` | Real wrapper exists; test enumeration-safe responses, offline, rate limit, and return path. |
| Reset password | `/reset-password` | Real wrapper exists; test missing/deep-link token, expired token, policy, and post-reset session invalidation. |
| Verify email | `/verify-email` | Real wrapper exists; delayed redirect and code lifecycle require integration tests. |
| Sign in | `/sign-in` | Missing route file; launch blocker. |
| Sign up | `/sign-up` | Missing route file; launch blocker. |
| Profile | `/profile` | Missing route file; feature also includes avatar permissions and logout overlays. |
| Auth dashboard | none | Not routable and would throw without AuthProvider. Decide whether to remove or integrate. |
| Upload | none | Not routable; permission/media/upload workflow is orphaned. Decide product scope. |
| Privacy | `/settingsPage/Privacy` | Export/reset/delete flows exist; legal copy, identity re-verification, deletion state machine, and offline/retry need E2E coverage. |
| Giving | `/settingsPage/Donate` | Misleading incomplete financial flow; P0. |
| Giving review | `/settingsPage/Payment` | Unreachable through intended completion and not a real receipt/payment; redesign/remove until integrated. |
| Help | `/settingsPage/help` | Ticket submission plus external contacts; test attachments expectation, offline drafts, throttling, and link failures. |
| About | `/settingsPage/About` | Admin/fallback content and external links; validate brand data and safe link handling. |
| Rate | `/settingsPage/Rate` | Store-link/platform/config failure paths need validation and feedback. |
| Word | `/settingsPage/Word` | Duplicates root modal content; test stale/offline content and source attribution. |
| Referral | `/settingsPage/Referral` | Sharing/reward claims need accurate backend truth, abuse rules, and invalid configuration states. |
| Word modal | global overlay | Interruptive timing and independent modal implementation; P1. |
| Account sheet | global overlay | 592-line alternate auth surface; consolidate with the canonical auth state machine. |
| Trust-device sheet | auth overlay | SecureStore is used; validate biometric enrollment changes, lockout, revocation, and fallback. |
| Action/confirm sheets | shared overlays | Standardize focus, dismissal, async and destructive behavior. |
| Mini player | global overlay | Validate tab-bar overlap, safe areas, keyboard, screen readers, route transitions, and dismissal. |
| Offline screen | root replacement | Blocks all local functionality; P0. |
| Error boundary | root/component fallback | Unit tested; add reset, recurrence, Sentry redaction, and native fatal-path tests. |

## Architecture target

Use domain boundaries rather than screen-sized service files:

1. `app/`: typed route entries only; no business logic.
2. `features/auth`, `features/catalog`, `features/playback`, `features/library`, `features/live`, `features/giving`, `features/settings`: UI, state machine, hooks, and tests owned by a domain.
3. `core/api`: generated/validated contracts, auth interceptor, error taxonomy, cancellation, retries, request metadata.
4. `core/storage`: SecureStore credentials, versioned preferences, download database/jobs, migrations.
5. `design-system`: tokens and accessible Button, IconButton, Field, Select/SegmentedControl, SwitchRow, Dialog, Sheet, Toast, List, Empty/Error/Skeleton states.
6. `observability`: redacted logging, consent-aware analytics, performance spans, crash reporting, release metadata.

Server-provided app configuration must use a versioned runtime schema with defaults, validation, safe icon/route enums, rollout controls, and last-known-good caching. It must never provide arbitrary executable navigation or unsafe URL schemes.

## World-class delivery process

### Gate 1: Product contract

- Name every supported persona and top task.
- Define the navigation map and ownership of every screen/overlay.
- Write happy, empty, loading, offline, timeout, permission-denied, auth-expired, validation, conflict, and server-error states before implementation.
- Remove or hide every unfinished promise. No “coming soon” inside a transactional flow.

### Gate 2: Design contract

- Maintain Figma/source-of-truth specs for phone, small phone, tablet, landscape, dark/light, Dynamic Type, and RTL.
- Require tokens and accessible primitives; prohibit one-off modal and button implementations without review.
- Review complete workflows, not isolated screens. Include keyboard and screen-reader focus maps.

### Gate 3: Engineering contract

- Typed routes with route/file parity tests and no `as never` escape hatches.
- Runtime-validated API/config payloads and explicit domain error types.
- One auth state machine and secure credential storage.
- Architecture decision records for auth, playback, downloads, remote config, payments, and observability.
- Feature flags must fail closed and have owners/removal dates.

### Gate 4: Automated quality

- Unit tests for domain logic and state machines.
- Integration tests for every screen state and overlay.
- Native E2E tests for top journeys on iOS and Android.
- Accessibility checks, route parity, API schema compatibility, visual regression, dependency/security scanning, and coverage thresholds in CI.
- Build and install signed release candidates; tests against dev mode alone are insufficient.

### Gate 5: Measured performance and reliability

- Establish budgets for cold/warm start, time to first interaction, JS/UI dropped frames, memory, app size, media start/buffering, search p95, API failure, and download completion.
- Test low-memory termination, background/foreground, calls/audio interruption, rotation, poor network, airplane mode, server 5xx/429, expired auth, storage full, and app upgrade/migration.
- Track crash-free and ANR-free sessions by release and device class.

### Gate 6: Release readiness

- Privacy/security threat model, data inventory, consent behavior, retention/deletion proof, secrets scan, and penetration test.
- Store metadata, permissions, legal URLs, support process, incident runbook, rollback, kill switches, staged rollout, and monitoring alerts.
- A release has zero open P0/P1 issues. P2 exceptions require an owner, due date, user impact statement, and explicit approval; they are not an invisible backlog.

## Recommended execution order

1. Fix route completeness and unify auth/session architecture.
2. Move native credentials to SecureStore and validate the server authorization model.
3. Replace root offline blockade with offline-capable navigation and harden downloads.
4. Remove or fully implement the giving/payment journey.
5. Standardize modal/sheet behavior and prevent unsolicited overlay collisions.
6. Establish accessible design-system primitives and remediate every core journey.
7. Add route, integration, E2E, accessibility, and release-build gates.
8. Profile and split media/service hotspots against explicit budgets.
9. Perform screenshot-based visual QA on the full device/state matrix and revise hierarchy/content.
10. Run security/privacy/release-readiness review before staged beta.

## Definition of done for this audit

This document is the static architecture and workflow baseline. It is not a visual certification. The next review stage must run the app against a controlled API dataset on iOS and Android, capture every screen/state at defined viewports, exercise native permissions and deep links, profile real devices, and convert verified findings into owned implementation slices with acceptance tests.

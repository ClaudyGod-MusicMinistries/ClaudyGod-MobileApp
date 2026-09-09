# ClaudyGod Mobile — Professional Deep Review

Date: 2026-09-07
Reviewer pass: static architecture, code, configuration, CI, release tooling
Scope: `apps/mobile` (Expo SDK 54 / React Native 0.81 / expo-router 6) — 161 TS/TSX files, ~24k LOC

---

## 1. Verdict

This is a **mature, well-engineered application** that has already been through several
hardening cycles (see `docs/MOBILE_APP_DEEP_REVIEW.md`, 2026-07-27). It is not a
rough draft. Almost every P0 from the July review is genuinely fixed in the code:

| July P0 | Status now | Evidence |
|---|---|---|
| Missing auth route files / dead navigation | Fixed | `test/release-contracts.test.cjs:11` route-parity guard; all wrappers exist |
| Native tokens in AsyncStorage | Fixed | `lib/authSessionStorage.ts` — SecureStore + one-time migration; web is memory-only |
| Offline blockade replaces whole app | Fixed | `app/_layout.tsx:107` non-blocking `OfflineBanner`, tree stays mounted |
| Giving flow shows fake payment methods | Fixed | `app/settingsPage/Donate.tsx:252` — honest "not a completed payment" copy, backend-authoritative intent |
| Two competing auth providers | Fixed | single `AuthProvider` at `app/_layout.tsx:122`, guarded by contract test |

Current automated gate: **all green** — `tsc --noEmit` clean, `eslint .` clean,
61 automated checks pass (`node --test` 25 + `vitest` 36). CI runs a real
quality gate on every PR (`.github/workflows/quality-gate.yml`), a release
certifier (`scripts/certify-release.js`), and a gated EAS store pipeline.

**However**, "passes its gates" is not the same as "top-tier consumer app". Five
areas below keep it short of that bar. None are cosmetic.

---

## 2. Priority findings

### P0 — blocks a credible "top" music app

#### P0-1 · Background playback is half-implemented

`components/media/AudioPlayer.tsx:243` sets `shouldPlayInBackground: true` and
`app.config.js` declares `UIBackgroundModes: ['audio']`, so audio keeps playing
when the screen locks. But there are **no lock-screen / Control Center / Android
notification transport controls and no now-playing metadata** (title, artist,
artwork, scrubber). A worship/sermon streaming app is used screen-off almost by
definition; today the only way to pause is to reopen the app.

The groundwork exists but is unwired — `playback/queue.ts` (queue reducer, fully
unit-tested) and `playback/remote.ts` (resume-position sync) both carry
"Nothing imports this yet" comments. The player is also a per-screen
`useAudioPlayer` instance inside `AudioPlayer.tsx`, so audio state is component
-scoped rather than a singleton service — navigating away from the player screen
risks tearing down playback.

**Fix:** build the Phase-1 playback service — a single app-level audio engine
(`react-native-track-player` or `expo-audio` + a MediaSession/`MPNowPlayingInfoCenter`
bridge), fed by the existing `playback/queue.ts`, exposed through a context;
wire lock-screen controls, now-playing info, and the `playback/remote.ts`
heartbeat + resume-on-launch. `setAudioModeAsync` should run once at app root,
not in a screen effect.

#### P0-2 · Behavioral test coverage is thin for the size of the app

Real behavioral tests: **36**, all in `playback/queue.test.ts`. The other 25
checks in `test/release-contracts.test.cjs` are **source-text regex assertions**
("file contains `createPublicDonationIntent(`") — excellent regression guards
for past decisions, but they do not exercise a single rendered screen, tap,
navigation, or network path. There are zero component, integration, or E2E
tests. `vitest.config.ts` is explicitly limited to framework-free modules.

For an app that handles auth, payments-adjacent giving, privacy/data-deletion,
downloads, push, and live messaging, this is the single largest release risk:
the gate is green while every user journey is unverified.

**Fix:** add React Native Testing Library + a jsdom/RN preset for component and
hook tests (auth forms, giving validation, library states, offline recovery,
modal focus/back); add Maestro or Detox flows for the top journeys (cold launch
→ play a track → background it → lock-screen pause; giving request; privacy
export/delete; deep link). Make route-parity, a11y lint, and a coverage floor
CI gates.

### P1 — quality bar for "top", pre-launch

#### P1-1 · God-files that cannot be safely owned or tested

| File | Lines |
|---|---|
| `components/media/VideoPlayer.tsx` | 1003 |
| `services/authService.ts` | 707 |
| `app/(tabs)/library.tsx` | 685 |
| `app/(tabs)/settings.tsx` | 606 |
| `services/userFlowService.ts` | 586 |
| `components/media/AudioPlayer.tsx` | 586 |
| `features/auth/profile.tsx` | 552 |
| `app/(tabs)/search.tsx` | 520 |
| `services/contentService.ts` | 519 |
| `app/live/[sessionId].tsx` | 513 |

Several also cram multi-statement JSX onto single lines (`Donate.tsx:220`,
`live/[sessionId].tsx`), which defeats diff review and blame. Decompose into a
domain module with a hook + presentational parts, each independently testable.

#### P1-2 · Typed-route escape hatches

19 `as never` casts on navigation calls (`app/(tabs)/home.tsx:389`,
`components/TabBar.tsx:69,395`, and 16 more) bypass expo-router's typed-route
checking — exactly the class of bug that produced the July "dead route" P0.
Adopt expo-router typed routes (`experiments.typedRoutes`) and a typed
`router.push` wrapper; delete the casts.

#### P1-3 · Inconsistent image pipeline

Raw React Native `<Image>` is used in ~14 files (`app/(tabs)/settings.tsx`,
`library.tsx`, `search.tsx`, `live/[sessionId].tsx`, `components/feed/*`,
`TabBar.tsx`) alongside `AppImage`/`expo-image` elsewhere. No single policy for
disk/memory cache, decode size, placeholder, priority, or CDN transforms. On
a media-grid app this shows up as jank and memory pressure. Route everything
through `AppImage` and give it an explicit caching/resizing contract.

#### P1-4 · No performance measurement or budget

No cold/warm-start instrumentation, no JS/UI frame or memory profiling, no app
-size budget. `app/(tabs)/home.tsx` renders every feed section inside one
`ScrollView` via `.map()` (`home.tsx:379`); `ContinueRow` is a horizontal
`ScrollView` (bounded to 8, acceptable). Set budgets (TTI p50/p95, dropped
frames, memory ceiling, media start-to-first-audio) and measure on a low-end
Android device before and after the playback-service work.

#### P1-5 · Accessibility is partial

24 of 86 component/screen files reference `accessibilityLabel`/`Role`. TabBar,
giving, and the calendar are now well-covered; media transport controls,
several selectable chips, and switches still lack complete label/role/state.
No screen-reader or Dynamic Type QA has been done. Add an a11y lint rule and a
manual VoiceOver/TalkBack pass on every core journey.

#### P1-6 · No localization framework

All UI copy, currency formatting (`Donate.tsx` concatenates symbol + string
amount), dates, and scripture references are hard-coded English. If a second
language or locale-correct currency is ever in scope, retrofitting is far more
expensive later. Introduce `i18n` (even with a single `en` catalog) and
`Intl.NumberFormat` for money now.

### P2 — polish and hardening

- `services/apiClient.ts:145` collapses every unexpected failure to HTTP 500 and
  discards the underlying error; request cancellation is not distinguished from
  a real failure. Preserve `cause` and add an explicit `isCancelled` path.
- Many storage/network `catch` blocks are silent. Best-effort is fine for
  analytics; downloads, preferences, and auth need observable failures.
- `context/DownloadsContext.tsx` — `createDownloadResumable` resume data is not
  persisted, completion URI/content-type is trusted, no free-space check, no
  cancellation. Build a real download manager with persisted jobs.
- Brand-name consistency ("ClaudyGod" vs "ClaudyGo") across assets/services —
  establish one content authority (flagged July, re-verify).
- `app/_layout.tsx:30` global error handler only installs in production; a dev
  build swallows the same class of error differently. Acceptable, but document.
- Modal stack: three foundations (`ConfirmModal`, `BottomSheet`/`ActionSheet`,
  RN `Modal`). The contract test pins the allowed set, but focus-trap,
  hardware-back, keyboard-avoidance, and stacking are not verified behaviourally.
- Deep-link surface (`app/section/[sectionId].tsx`, `live/[sessionId].tsx`) —
  test invalid/malicious/oversized params and no-history back.

---

## 3. What is already good (keep it)

- Strict TypeScript, zero-warning ESLint, reproducible toolchain, lefthook
  pre-push checks.
- Credential handling: SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`,
  legacy migration, memory-only web tokens, PKCE OAuth via a server broker.
- Permission hygiene: contract test fails the build if a sensitive permission
  (camera, mic, photo library) is declared without a feature using it;
  iOS privacy manifest present.
- Release discipline: `certify-release.js` gates on real HTTPS config, matching
  bundle IDs, 1024² artwork, real device screenshots, and signed privacy /
  content-rating / smoke-test evidence.
- Design system: token-driven theming, light/dark parity enforced by tests,
  `useReducedMotion` honored throughout, responsive device-class helpers.
- Honest product surfaces: giving is a tracked request not a fake charge;
  legal docs are backend-authoritative; guest/installation model is coherent.
- Observability foundation: Sentry wrap, breadcrumbs on every HTTP call,
  `ErrorBoundary` at root.

---

## 4. Recommended execution plan

**Workstream A — Playback service (P0-1).** ~1–2 weeks. Single audio engine +
queue + lock-screen/now-playing + resume sync. Highest user-visible impact.

**Workstream B — Test & CI safety net (P0-2).** ~1–2 weeks, parallelizable.
RN Testing Library setup, component/hook tests for auth + giving + library +
offline + modals, Maestro E2E for 4 top journeys, coverage + a11y + typed-route
CI gates.

**Workstream C — Structural cleanup (P1-1..P1-6).** Ongoing, low-risk slices:
decompose one god-file per PR behind its new tests, kill `as never`, unify the
image pipeline, add i18n scaffolding, add startup instrumentation, a11y lint +
manual pass.

**Then — Gate D — Device QA & measurement.** Screenshot matrix (iOS 6.7"/6.1",
small Android, tablet, light/dark, large font), low-end-device performance run
against the budgets, VoiceOver/TalkBack pass, security/privacy re-review.

A release candidate should carry zero open P0/P1; each P2 exception needs an
owner and a date.

# Release smoke test — physical device evidence

Run this on a **real iPhone and a real Android phone** against a **production EAS
build** pointed at the production API. Fill in every row. A release is not approved
while any BLOCKER row is failing.

**Build:** _(EAS build id / version / build number)_
**iOS device / OS:** _(e.g. iPhone 13, iOS 18.x)_
**Android device / OS:** _(e.g. Pixel 6, Android 15)_
**Tester / date:** _(fill in)_

| # | Check | Type | iOS | Android | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Cold launch to Home in < 3 s | BLOCKER | ☐ | ☐ | |
| 2 | Onboarding shows once on first launch, not again | normal | ☐ | ☐ | |
| 3 | Home / Videos / Library / Search / Settings tabs load real content | BLOCKER | ☐ | ☐ | |
| 4 | Play an **uploaded audio** track — audio starts, scrubber moves | BLOCKER | ☐ | ☐ | |
| 5 | **Lock the screen while audio plays — audio continues** | BLOCKER | ☐ | ☐ | 2.5.4 — must pass |
| 6 | **Background the app 5 min — audio still playing on return** | BLOCKER | ☐ | ☐ | |
| 7 | Lock-screen / notification shows track info (may be minimal pre-Phase 1) | normal | ☐ | ☐ | |
| 8 | Play a **YouTube** item — opens the visible video player, plays | BLOCKER | ☐ | ☐ | no hidden-audio path |
| 9 | Next / previous / shuffle / repeat behave correctly | normal | ☐ | ☐ | |
| 10 | Download a track, enable Airplane mode, play it from Library | BLOCKER | ☐ | ☐ | |
| 11 | Live tab: a scheduled/live session opens; chat loads | normal | ☐ | ☐ | |
| 12 | Word of the Day widget/modal loads a verse | normal | ☐ | ☐ | |
| 13 | Sign up with email → verify → signed in | BLOCKER | ☐ | ☐ | |
| 14 | Sign in with Apple completes and returns to the app | BLOCKER | ☐ | ☐ | 4.8 / 5.1 |
| 15 | Sign in with Google completes | normal | ☐ | ☐ | |
| 16 | Biometric unlock works after first password sign-in | normal | ☐ | ☐ | |
| 17 | Settings → **Delete my account** → schedules deletion, shows date, sends email | BLOCKER | ☐ | ☐ | 5.1.1(v) |
| 18 | Settings → **Cancel deletion** works before the date | BLOCKER | ☐ | ☐ | |
| 19 | Export my data request submits | normal | ☐ | ☐ | |
| 20 | Reset recommendations (guest + signed-in) | normal | ☐ | ☐ | |
| 21 | Giving: create a giving request → confirmation → external link opens in browser | BLOCKER | ☐ | ☐ | no in-app charge |
| 22 | Help: submit a support request → get a ticket id | normal | ☐ | ☐ | |
| 23 | Privacy Policy and Terms screens load full text | BLOCKER | ☐ | ☐ | |
| 24 | Referral: code shows, share sheet opens, deep link `claudygod.org/join` resolves | normal | ☐ | ☐ | |
| 25 | Push notification permission prompt appears only after the user opts in | BLOCKER | ☐ | ☐ | 5.1.1 |
| 26 | **No camera / photo / microphone permission prompt appears anywhere** | BLOCKER | ☐ | ☐ | must be true |
| 27 | Airplane mode on launch → offline banner, public content from cache, no crash | BLOCKER | ☐ | ☐ | |
| 28 | Kill and relaunch mid-track → resumes near the same position | normal | ☐ | ☐ | |
| 29 | Rotate device / large text (Accessibility) → layout holds | normal | ☐ | ☐ | |
| 30 | VoiceOver / TalkBack: player controls and tabs are labelled | normal | ☐ | ☐ | |
| 31 | Force a network error mid-request → friendly retry UI, no crash | BLOCKER | ☐ | ☐ | |
| 32 | Trigger a JS error in a screen → Error Boundary "Try again", Sentry event (if diagnostics on) | normal | ☐ | ☐ | |

## Result

- BLOCKER rows all passing: ☐ yes ☐ no
- Non-blocker failures logged as issues: _(list)_
- Approved for submission by: _(name, date)_

# Store listing metadata

Reference copy for Google Play Console and App Store Connect. Paste into the console by
hand for now (or wire up `eas metadata` later if automated submission is worth the setup).

## App name

ClaudyGod

## Subtitle / short description

*(Google Play short description, max 80 characters)*

Worship music, videos & ministry updates from ClaudyGod.

## Full description

*(Google Play full description, max 4000 characters — Apple's App Store description has no
hard limit but keep it similarly concise)*

ClaudyGod brings worship music, videos, and ministry updates into one place — stream
freely, no account required to start listening and watching.

**Listen & watch**
Browse a growing library of worship audio and video, organized into playlists you can
play straight through or shuffle.

**Stay current**
Catch live sessions as they happen, and get the Word of the Day delivered right to your
home screen.

**Make it yours**
Save favorites, build a personal library, and pick up where you left off across sessions.

**Built for everyone**
Light and dark themes, adjustable text, and a clean, distraction-free player.

## Keywords (Apple App Store, comma-separated, max 100 characters)

worship,gospel,christian music,ministry,praise,devotional,sermons,christian videos

## Category

Primary: Music
Secondary: Lifestyle

## Content rating

Rate **4+ / Everyone**. All catalogue content is published by ClaudyGod administrators;
the only user input visible to anyone is moderated live-session chat. Full questionnaire
answers: `store-listing/evidence/content-rating.md`.

## Support & legal URLs

- Support: https://claudygod.org (in-app Help screen also files tracked support requests)
- Privacy Policy: https://claudygod.org/legal/privacy — **verified live (HTTP 200), real
  policy page**, 2026-08-29.
- Terms of Service: https://claudygod.org/legal/terms — **verified live (HTTP 200)**,
  2026-08-29.
- Account deletion: in-app (Settings → Privacy & Security → "Delete my account"). No
  external URL needed.

## Device support

iPhone-only for v1 (`EXPO_IOS_SUPPORTS_TABLET=false`). No iPad screenshots required.
Android phone only.

## Screenshots

Capture from the production candidate build — see `store-listing/screenshots/README.md`
for exact sizes, filenames, and the capture procedure. `yarn release:certify` checks for
`ios-6.7/{home,player,library}.png` and `android-phone/{home,player,library}.png`.

- iOS: 6.7" (1290×2796) required; 6.5" (1284×2778) for the console upload.
- Android: phone, ~1080×2340.
- **No iPad set** (tablet support is off for v1).

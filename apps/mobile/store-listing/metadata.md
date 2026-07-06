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

No user-generated content is visible to other users; all content is published by
ClaudyGod administrators. Rate as "Everyone" / 4+ pending final content-catalog review.

## Support & legal URLs

- Support: https://claudygod.org (in-app Help screen also submits support requests directly)
- Privacy Policy: https://claudygod.org/legal/privacy — served by `services/api`'s
  `legal.routes.ts`; confirm the production domain routes `/legal/privacy` to the API
  before submitting (see `docs/RUNBOOK.md`).
- Terms of Service: https://claudygod.org/legal/terms

## Screenshots

Not yet captured — capture after the design-system consolidation pass (card component
dedup, styling migration) lands, so screenshots reflect the shipped UI rather than a
version that's about to change. Required sizes:

- iOS: 6.7" (1290×2796), 6.5" (1284×2778), and iPad 12.9" (2048×2732) since
  `ios.supportsTablet` is enabled.
- Android: phone (min 320px, max 3840px on the long edge) and, optionally, a 7"/10"
  tablet set.

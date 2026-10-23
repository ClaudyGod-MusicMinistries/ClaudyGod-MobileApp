# Brand assets — source of truth

`logo-master.svg`, `logo-mark-transparent.svg`, and `logo-lockup.svg` are the hand-authored brand files.
Every raster asset consumed by the mobile app, admin panel, and backend is generated from
them — never hand-edit a PNG in `apps/mobile/assets`, `admin/web/public/brand`, or
`services/api/src/assets` directly; regenerate instead:

```
yarn brand:generate
```

(Requires `sharp`, already a devDependency of `apps/mobile`. Run via `node brand/generate-assets.mjs`
or `yarn --cwd apps/mobile exec node ../../brand/generate-assets.mjs`.)

## The mark

"CMM Cross & Arrow" — The official ClaudyGod Music & Ministries emblem. Features the stylized 'C',
a downward sword cross (`†`) forming the left stroke of 'M', and an ascending upward arrow (`↑`)
forming the right ascent of 'M', in electric royal purple (`#8F3EF2` / `#9542F6`) on a deep
midnight charcoal field (`#16131C`).

- `logo-master.svg` — opaque square, `#16131C` background baked in. Feeds the iOS icon (1024x1024,
  channels: 3, no alpha channel per Apple App Store requirements), favicon, and the in-app/admin/email
  brand assets. Square corners are intentional: every consumer applies its own rounding (iOS icon mask,
  CSS `border-radius`, or React Native `overflow: hidden`).
- `logo-mark-transparent.svg` — the CMM emblem alone on a transparent field, centered within Android's
  ~66% adaptive-icon safe zone so it is never clipped by circular, squircle, or pebble launcher masks.
  Also feeds the Android adaptive icon foreground and the Expo splash screen.
- `logo-lockup.svg` — full brand lockup featuring the CMM emblem on top with the official "claudyGod.
  MUSIC & MINISTRIES" wordmark below it. Feeds `brand-lockup.png` across mobile and admin web.

## If the mark changes

Edit the SVGs, re-run `yarn brand:generate`, and verify the regenerated PNGs. If the background color
changes, keep these three places in sync: `logo-master.svg`'s `<rect fill>`, `ICON_BG` in
`generate-assets.mjs`, and `android.adaptiveIcon.backgroundColor` / `splash.backgroundColor` in
`apps/mobile/app.config.js` (`BRAND_DARK`) + `constants/color.ts`'s `brandCanvas`.

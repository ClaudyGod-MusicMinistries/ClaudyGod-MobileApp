# Brand assets — source of truth

`logo-master.svg` and `logo-mark-transparent.svg` are the only hand-authored brand files.
Every raster asset consumed by the mobile app, admin panel, and backend is generated from
them — never hand-edit a PNG in `apps/mobile/assets`, `admin/web/public/brand`, or
`services/api/src/assets` directly; regenerate instead:

```
yarn brand:generate
```

(Requires `sharp`, already a devDependency of `apps/mobile`. If it isn't hoisted to the
root `node_modules` in your install, run `yarn --cwd apps/mobile exec node ../../brand/generate-assets.mjs`.)

## The mark

"Rising Flame" — an ascending flame with a single flicker notch, on a deep indigo
(`#1C1230`) field with an ivory (`#F5F1FF`) mark. Chosen from three concept directions
(flame, soundwave, ribbon monogram) for reading clearly as a single flat glyph at both
16px and 1024px, with no gradient or fine detail that would degrade at small sizes.

- `logo-master.svg` — opaque square, indigo background baked in. Feeds the iOS icon,
  favicon, and the small in-app/admin/email brand asset. Square corners are intentional:
  every consumer already applies its own rounding (iOS's icon mask, CSS `border-radius`,
  or a React Native `View` with `overflow: hidden`), so the source stays a plain square.
- `logo-mark-transparent.svg` — the flame alone on a transparent field, pre-inset to
  Android's ~66% adaptive-icon safe zone. Feeds the Android adaptive icon foreground and
  the Expo splash image (which floats on `app.config.js`'s `splash.backgroundColor`).

## If the mark changes

Edit the two SVGs, re-run `yarn brand:generate`, and commit the regenerated PNGs alongside
the SVG diff. If the background color changes, update it in three places that intentionally
don't derive from the SVG automatically: `logo-master.svg`'s `<rect fill>`, the
`flattenBg`/`ICON_BG` constant in `generate-assets.mjs`, and `android.adaptiveIcon.backgroundColor`
/ `splash.backgroundColor` in `apps/mobile/app.config.js` — these should stay in sync with
`constants/color.ts`'s canonical dark background token (see the app's design-system docs).

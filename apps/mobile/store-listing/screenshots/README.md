# Store screenshots

`yarn release:certify` requires these exact files. They must be captured from the
**production build** (or a clean simulator/emulator running that build), never mockups.

```
screenshots/
  ios-6.7/         iPhone 6.7" — 1290 × 2796 px  (iPhone 15/16 Pro Max)
    home.png
    player.png
    library.png
    videos.png        (recommended, not gate-required)
    live.png          (recommended)
  android-phone/   1080 × 2340 px or similar 9:19.5
    home.png
    player.png
    library.png
    videos.png        (recommended)
    live.png          (recommended)
```

Also upload to the consoles (not gate-checked here, but required to publish):

- **iPhone 6.5"** — 1284 × 2778 (or reuse 6.7" if App Store Connect accepts it)
- **iPad 12.9"** — only if `EXPO_IOS_SUPPORTS_TABLET=true` (it is `false` for v1, so
  skip iPad entirely)

## How to capture

1. Build the production candidate: `eas build --profile production --platform all`
   (or `--profile preview` for an install-and-shoot build).
2. Install on the device / simulator.
3. Sign in with a demo account that has a populated library so Library and Player
   look real (not empty states).
4. Capture:
   - **home** — the Home tab, scrolled to show a rail or two.
   - **player** — the `/player` tab with a track playing (artwork, controls, up-next).
   - **library** — the Library tab with saved items + a download.
   - **videos** — the Videos tab with the video player open.
   - **live** — a live or scheduled session.
5. iOS Simulator: `Cmd+S` saves to Desktop at the correct pixel size for the chosen
   device. Android emulator: use the camera button in the toolbar, or
   `adb exec-out screencap -p > home.png`.
6. Do **not** add device frames or marketing text for the App Store upload (Apple
   wants raw screenshots). A separate framed set for Play Store feature graphics is
   optional.

## Checklist

- [ ] `ios-6.7/` has home, player, library (+ videos, live)
- [ ] `android-phone/` has home, player, library (+ videos, live)
- [ ] All shots are from the production build, real data, no placeholder empty states
- [ ] `node scripts/certify-release.js` no longer reports missing screenshots

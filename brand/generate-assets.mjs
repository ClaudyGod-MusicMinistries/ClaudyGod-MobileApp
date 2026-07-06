// Regenerates every raster brand asset from the two SVG masters in this directory.
// Run from repo root: `node brand/generate-assets.mjs` (requires `sharp`, a devDependency
// of apps/mobile — run via `yarn --cwd apps/mobile exec node ../../brand/generate-assets.mjs`
// if `sharp` isn't hoisted to the root node_modules in your install).
//
// Never hand-edit the generated PNGs — change logo-master.svg / logo-mark-transparent.svg
// and re-run this script instead, so every consumer stays derived from one source of truth.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

const masterSvg = readFileSync(path.join(here, 'logo-master.svg'));
const transparentSvg = readFileSync(path.join(here, 'logo-mark-transparent.svg'));

const ICON_BG = '#1C1230';

const targets = [
  // iOS App Store icon: opaque, no alpha channel (Apple rejects icons with alpha).
  {
    src: masterSvg,
    out: 'apps/mobile/assets/icon.png',
    size: 1024,
    flattenBg: ICON_BG,
  },
  // Android adaptive icon foreground: transparent, pre-inset to the safe zone.
  {
    src: transparentSvg,
    out: 'apps/mobile/assets/adaptive-icon.png',
    size: 1024,
  },
  // Splash image: same transparent mark, floats on app.config.js's splash backgroundColor.
  {
    src: transparentSvg,
    out: 'apps/mobile/assets/splash-icon.png',
    size: 1024,
  },
  // Web favicon.
  {
    src: masterSvg,
    out: 'apps/mobile/assets/favicon.png',
    size: 180,
  },
  // Small in-app / admin / email brand asset — same opaque square everywhere.
  {
    src: masterSvg,
    out: 'apps/mobile/assets/images/logo.png',
    size: 512,
  },
  {
    src: masterSvg,
    out: 'admin/web/public/brand/claudy-logo.png',
    size: 512,
  },
  {
    src: masterSvg,
    out: 'services/api/src/assets/ClaudyGoLogo.png',
    size: 512,
  },
];

for (const target of targets) {
  let pipeline = sharp(target.src, { density: 384 }).resize(target.size, target.size);
  if (target.flattenBg) {
    pipeline = pipeline.flatten({ background: target.flattenBg });
  }
  const outPath = path.join(repoRoot, target.out);
  await pipeline.png().toFile(outPath);
  console.log(`wrote ${target.out} (${target.size}x${target.size}${target.flattenBg ? ', flattened' : ''})`);
}

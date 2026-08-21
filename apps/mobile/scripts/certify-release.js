/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
process.env.CLAUDYGOD_ENV = 'production';
process.env.NODE_ENV = 'production';
const config = require(path.join(root, 'app.config.js')).expo;
const failures = [];

const fail = (message) => failures.push(message);
const requireHttps = (label, value) => {
  if (!value) return fail(`${label} is missing`);
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || /localhost|example|validation/i.test(parsed.hostname)) fail(`${label} must be a real HTTPS production URL`);
  } catch { fail(`${label} is not a valid URL`); }
};

requireHttps('EXPO_PUBLIC_API_URL', config.extra.EXPO_PUBLIC_API_URL);
requireHttps('EXPO_PUBLIC_SUPABASE_URL', config.extra.EXPO_PUBLIC_SUPABASE_URL);
requireHttps('EXPO_PUBLIC_SENTRY_DSN', config.extra.EXPO_PUBLIC_SENTRY_DSN);
if (!config.extra.EXPO_PUBLIC_SUPABASE_KEY || /placeholder|your_/i.test(config.extra.EXPO_PUBLIC_SUPABASE_KEY)) {
  fail('EXPO_PUBLIC_SUPABASE_KEY is missing or a placeholder');
}
if (!config.ios?.bundleIdentifier || config.ios.bundleIdentifier !== config.android?.package) fail('iOS and Android application identifiers must match the approved identity');
if (!config.runtimeVersion || !config.updates?.url) fail('Production runtime version and EAS Updates URL are required');

const requiredScreenshots = [
  'ios-6.7/home.png', 'ios-6.7/player.png', 'ios-6.7/library.png',
  'android-phone/home.png', 'android-phone/player.png', 'android-phone/library.png',
];
for (const screenshot of requiredScreenshots) {
  if (!fs.existsSync(path.join(root, 'store-listing/screenshots', screenshot))) fail(`Missing real-device store screenshot: ${screenshot}`);
}

const requiredEvidence = ['privacy-review.md', 'content-rating.md', 'release-smoke-test.md'];
for (const evidence of requiredEvidence) {
  if (!fs.existsSync(path.join(root, 'store-listing/evidence', evidence))) fail(`Missing signed release evidence: ${evidence}`);
}

async function verifyArtwork() {
  for (const asset of ['icon.png', 'adaptive-icon.png', 'splash-icon.png']) {
    const metadata = await sharp(path.join(root, 'assets', asset)).metadata();
    if (metadata.width !== 1024 || metadata.height !== 1024 || metadata.format !== 'png') {
      fail(`${asset} must be a 1024x1024 PNG`);
    }
  }
}

verifyArtwork().then(() => {
  if (failures.length) {
    process.stderr.write(`Release certification FAILED (${failures.length} blocker${failures.length === 1 ? '' : 's'}):\n`);
    for (const failure of failures) process.stderr.write(`- ${failure}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Release certification PASSED: production configuration, artwork, screenshots, and review evidence are complete.\n');
}).catch((error) => {
  process.stderr.write(`Release certification failed while reading artwork: ${error.message}\n`);
  process.exitCode = 1;
});

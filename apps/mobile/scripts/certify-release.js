/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
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

// Catches a real incident (2026-09-26): EXPO_PUBLIC_EAS_PROJECT_ID / EAS_PROJECT_ID
// in .env.production silently overrode the correct project id in app.config.js with
// a stale one from an earlier `eas init` run. Nothing above this point can detect
// that — the id is well-formed and present, it's just wrong — so `eas build` was the
// first thing to actually notice, with an opaque "Experience with id '...' does not
// exist" GraphQL error three commands deep. This makes the same check happen here,
// in seconds, with a message that says what's actually wrong.
//
// Best-effort: skips (not fails) when eas-cli isn't installed or isn't authenticated
// in this environment, since certify-release.js is also run in contexts where EAS
// access isn't set up yet (a fresh checkout, a config-only sanity check).
function verifyEasProjectLinked() {
  const projectId = config.extra?.eas?.projectId;
  if (!projectId) return; // Already reported by the runtimeVersion/updates.url check above.

  try {
    execFileSync('eas', ['whoami'], { cwd: root, stdio: 'pipe' });
  } catch {
    process.stderr.write(
      '  (skipped) Could not verify the EAS project id against the server — eas-cli is not ' +
      'installed or not authenticated here. Run "eas whoami" to check, then re-run this ' +
      'script from an environment where it succeeds before starting a real build.\n',
    );
    return;
  }

  try {
    execFileSync('eas', ['build:list', '--limit', '1', '--non-interactive', '--json'], { cwd: root, stdio: 'pipe' });
  } catch (error) {
    const output = String(error.stdout || '') + String(error.stderr || '') + String(error.message || '');
    if (/does not exist/i.test(output)) {
      fail(
        `EAS project id ${projectId} does not exist on the authenticated account. ` +
        'Check for a stale EXPO_PUBLIC_EAS_PROJECT_ID or EAS_PROJECT_ID in .env.production ' +
        '— either one silently overrides app.config.js\'s DEFAULT_EAS_PROJECT_ID.',
      );
    } else {
      process.stderr.write(`  (warning) Could not confirm the EAS project id via "eas build:list": ${output.trim().slice(0, 300)}\n`);
    }
  }
}

verifyEasProjectLinked();

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

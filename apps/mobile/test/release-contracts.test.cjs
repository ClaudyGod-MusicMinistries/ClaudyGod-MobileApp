const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/* global __dirname */

const root = path.resolve(__dirname, '..');

test('every active static route has a matching Expo Router file', () => {
  const expected = [
    'app/index.tsx', 'app/(tabs)/home.tsx', 'app/(tabs)/player.tsx',
    'app/(tabs)/videos.tsx', 'app/(tabs)/live.tsx', 'app/(tabs)/search.tsx',
    'app/(tabs)/settings.tsx', 'app/(tabs)/library.tsx',
    'app/settingsPage/Privacy.tsx', 'app/settingsPage/Donate.tsx',
    'app/settingsPage/Payment.tsx', 'app/settingsPage/help.tsx',
    'app/settingsPage/About.tsx', 'app/settingsPage/Rate.tsx',
    'app/settingsPage/Word.tsx', 'app/settingsPage/Referral.tsx',
    'app/live/[sessionId].tsx', 'app/section/[sectionId].tsx',
  ];
  for (const relativePath of expected) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `Missing route ${relativePath}`);
  }
});

test('root navigation does not force a launch delay or replace navigation offline', () => {
  const source = fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8');
  assert.doesNotMatch(source, /2200/);
  assert.doesNotMatch(source, /return\s+<OfflineScreen/);
  assert.match(source, /OfflineBanner/);
});

test('shared entrance motion honors reduced-motion preferences', () => {
  const source = fs.readFileSync(path.join(root, 'components/ui/FadeIn.tsx'), 'utf8');
  assert.match(source, /useReducedMotion/);
  assert.match(source, /if \(reduceMotion\)/);
});

test('library is explicitly device-local until authentication is implemented', () => {
  const layout = fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8');
  const libraryContext = fs.readFileSync(path.join(root, 'context/LocalContentContext.tsx'), 'utf8');
  const downloadsContext = fs.readFileSync(path.join(root, 'context/DownloadsContext.tsx'), 'utf8');
  assert.doesNotMatch(layout, /<UserAccountProvider>/);
  assert.match(libraryContext, /getFavorites\(\)/);
  assert.match(libraryContext, /addFavorite\(item\)/);
  assert.match(libraryContext, /addHistory\(item\)/);
  assert.doesNotMatch(libraryContext, /fetchMeLibrary|saveMeLibraryItem|removeMeLibraryItem/);
  assert.match(downloadsContext, /getDownloads\(\)/);
  assert.doesNotMatch(downloadsContext, /saveMeLibraryItem|removeMeLibraryItem/);
});

test('store builds declare every sensitive native permission with purpose-specific copy', () => {
  process.env.CLAUDYGOD_ENV = 'production';
  const configPath = path.join(root, 'app.config.js');
  delete require.cache[require.resolve(configPath)];
  const config = require(configPath).expo;
  const plugins = new Map(config.plugins.filter(Array.isArray).map(([name, options]) => [name, options]));
  const picker = plugins.get('expo-image-picker');
  const audio = plugins.get('expo-audio');
  const notifications = plugins.get('expo-notifications');
  assert.match(picker.photosPermission, /select.*you choose/i);
  assert.match(picker.cameraPermission, /only when you choose/i);
  assert.match(picker.microphonePermission, /only when you choose/i);
  assert.match(audio.microphonePermission, /only when you choose/i);
  assert.equal(audio.recordAudioAndroid, true);
  assert.equal(notifications.defaultChannel, 'default');
  assert.equal(notifications.enableBackgroundRemoteNotifications, false);
});

test('production identity, updates, and privacy manifest are deterministic', () => {
  process.env.CLAUDYGOD_ENV = 'production';
  const configPath = path.join(root, 'app.config.js');
  delete require.cache[require.resolve(configPath)];
  const config = require(configPath).expo;
  assert.match(config.ios.bundleIdentifier, /^[a-zA-Z][a-zA-Z0-9.-]+$/);
  assert.equal(config.android.package, config.ios.bundleIdentifier);
  assert.match(config.updates.url, /^https:\/\/u\.expo\.dev\/[0-9a-f-]{36}$/);
  assert.deepEqual(config.runtimeVersion, { policy: 'appVersion' });
  assert.ok(config.ios.privacyManifests.NSPrivacyAccessedAPITypes.length > 0);
});

test('store listing has legal URLs and contains no unresolved placeholder copy', () => {
  const metadata = fs.readFileSync(path.join(root, 'store-listing/metadata.md'), 'utf8');
  assert.match(metadata, /https:\/\/claudygod\.org\/legal\/privacy/);
  assert.match(metadata, /https:\/\/claudygod\.org\/legal\/terms/);
  assert.doesNotMatch(metadata, /YOUR_|example\.com|TBD/i);
});

test('vendored image parser rejects zero-length ICNS and ISO BMFF boxes without hanging', () => {
  const script = `
    const path = require('node:path');
    const packageRoot = path.dirname(require.resolve('image-size/package.json'));
    const { ICNS } = require(path.join(packageRoot, 'dist/types/icns.js'));
    const { JXL } = require(path.join(packageRoot, 'dist/types/jxl.js'));
    const icns = Buffer.from([0x69,0x63,0x6e,0x73, 0,0,0,16, 0x69,0x63,0x31,0x30, 0,0,0,0]);
    const jxlp = Buffer.from([0,0,0,0, 0x6a,0x78,0x6c,0x70, 0,0,0,0]);
    try { ICNS.calculate(icns); throw new Error('ICNS payload was accepted'); }
    catch (error) { if (!/Invalid ICNS/.test(String(error))) throw error; }
    try { JXL.calculate(jxlp); throw new Error('JXL payload was accepted'); }
    catch (error) { if (!/No codestream/.test(String(error))) throw error; }
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: root,
    encoding: 'utf8',
    timeout: 1_500,
  });
  assert.equal(result.signal, null, 'image parser process exceeded its bounded execution time');
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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

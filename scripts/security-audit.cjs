const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const expectedMitigations = new Set([
  'GHSA-w3rx-r6r6-pgpr',
  'GHSA-5p2g-fcmc-qvqq',
]);

function fail(message) {
  process.stderr.write(`Security audit failed: ${message}\n`);
  process.exit(1);
}

const imageSizePackage = path.join(root, 'node_modules/image-size/package.json');
const imageSizeUtils = path.join(root, 'node_modules/image-size/dist/types/utils.js');
const imageSizeIcns = path.join(root, 'node_modules/image-size/dist/types/icns.js');
if (![imageSizePackage, imageSizeUtils, imageSizeIcns].every(fs.existsSync)) {
  fail('image-size dependency is missing; run a frozen dependency install first');
}

const imageSizeVersion = JSON.parse(fs.readFileSync(imageSizePackage, 'utf8')).version;
if (imageSizeVersion !== '1.2.1') {
  fail(`vendored mitigation is certified only for image-size 1.2.1, found ${imageSizeVersion}`);
}
if (!fs.readFileSync(imageSizeUtils, 'utf8').includes('CLAUDYGOD_SECURITY_PATCH_GHSA_5P2G')) {
  fail('ISO BMFF parser mitigation is not installed');
}
if (!fs.readFileSync(imageSizeIcns, 'utf8').includes('CLAUDYGOD_SECURITY_PATCH_GHSA_W3RX')) {
  fail('ICNS parser mitigation is not installed');
}

const exploitRegression = spawnSync(
  process.execPath,
  ['--test', '--test-name-pattern', 'vendored image parser', 'apps/mobile/test/release-contracts.test.cjs'],
  { cwd: root, encoding: 'utf8', timeout: 5_000 },
);
if (exploitRegression.error || exploitRegression.signal || exploitRegression.status !== 0) {
  fail(`image parser exploit regression failed\n${exploitRegression.stderr || exploitRegression.stdout}`);
}

const audit = spawnSync(
  'yarn',
  ['audit', '--groups', 'dependencies', '--level', 'high', '--json'],
  { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
);
if (audit.error || audit.status === null) {
  fail(`registry audit could not run: ${audit.error?.message || 'unknown process failure'}`);
}

const events = audit.stdout
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  })
  .filter(Boolean);
const summary = events.find((event) => event.type === 'auditSummary');
if (!summary) {
  fail(`registry did not return an audit summary${audit.stderr ? `: ${audit.stderr.trim()}` : ''}`);
}

const blocking = events.filter((event) => {
  if (event.type !== 'auditAdvisory') return false;
  return ['high', 'critical'].includes(event.data?.advisory?.severity);
});
const seenMitigations = new Set();

for (const event of blocking) {
  const advisory = event.data.advisory;
  const advisoryId = advisory.github_advisory_id;
  const findings = advisory.findings || [];
  const exactMitigation =
    expectedMitigations.has(advisoryId) &&
    advisory.module_name === 'image-size' &&
    findings.length > 0 &&
    findings.every((finding) =>
      finding.version === '1.2.1' &&
      finding.paths?.length > 0 &&
      finding.paths.every((dependencyPath) => dependencyPath.startsWith('claudygod-mobile>expo>')),
    );

  if (!exactMitigation) {
    fail(`${advisoryId || advisory.id} (${advisory.module_name}) remains high/critical and is not mitigated`);
  }
  seenMitigations.add(advisoryId);
}

for (const advisoryId of expectedMitigations) {
  if (!seenMitigations.has(advisoryId)) {
    fail(`${advisoryId} disappeared from registry metadata; remove or reassess the vendored patch before proceeding`);
  }
}

process.stdout.write(
  `Security audit passed: no unmitigated high/critical advisories; ${blocking.length} Expo image-size findings are covered by verified exploit regressions.\n`,
);

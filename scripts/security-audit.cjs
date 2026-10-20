const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const expectedMitigations = new Set([
  'GHSA-w3rx-r6r6-pgpr',
  'GHSA-5p2g-fcmc-qvqq',
  'GHSA-86w9-cpqp-85rv',
  'GHSA-vfj7-8cjw-p6xm',
]);

function fail(message) {
  process.stderr.write(`Security audit failed: ${message}\n`);
  process.exit(1);
}

const mobileRoot = path.join(root, 'apps/mobile');

// 1. image-size (GHSA-5p2g-fcmc-qvqq & GHSA-w3rx-r6r6-pgpr)
const imageSizePackage = path.join(mobileRoot, 'node_modules/image-size/package.json');
const imageSizeUtils = path.join(mobileRoot, 'node_modules/image-size/dist/types/utils.js');
const imageSizeIcns = path.join(mobileRoot, 'node_modules/image-size/dist/types/icns.js');
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

// 2. node-forge (GHSA-86w9-cpqp-85rv / CVE-2026-85393)
const nodeForgePackage = path.join(mobileRoot, 'node_modules/node-forge/package.json');
const nodeForgeRsa = path.join(mobileRoot, 'node_modules/node-forge/lib/rsa.js');
if (![nodeForgePackage, nodeForgeRsa].every(fs.existsSync)) {
  fail('node-forge dependency is missing; run a frozen dependency install first');
}
const nodeForgeVersion = JSON.parse(fs.readFileSync(nodeForgePackage, 'utf8')).version;
if (nodeForgeVersion !== '1.4.0') {
  fail(`vendored mitigation is certified only for node-forge 1.4.0, found ${nodeForgeVersion}`);
}
if (!fs.readFileSync(nodeForgeRsa, 'utf8').includes('CLAUDYGOD_SECURITY_PATCH_GHSA_86W9')) {
  fail('node-forge nested DigestAlgorithm sequence mitigation is not installed');
}

// 3. braces (GHSA-vfj7-8cjw-p6xm / CVE-2026-93687)
const bracesPackage = path.join(mobileRoot, 'node_modules/braces/package.json');
const bracesParse = path.join(mobileRoot, 'node_modules/braces/lib/parse.js');
if (![bracesPackage, bracesParse].every(fs.existsSync)) {
  fail('braces dependency is missing; run a frozen dependency install first');
}
const bracesVersion = JSON.parse(fs.readFileSync(bracesPackage, 'utf8')).version;
if (bracesVersion !== '3.0.3') {
  fail(`vendored mitigation is certified only for braces 3.0.3, found ${bracesVersion}`);
}
if (!fs.readFileSync(bracesParse, 'utf8').includes('CLAUDYGOD_SECURITY_PATCH_GHSA_VFJ7')) {
  fail('braces recursion depth guard mitigation is not installed');
}

const exploitRegression = spawnSync(
  process.execPath,
  ['--test', '--test-name-pattern', 'vendored', 'apps/mobile/test/release-contracts.test.cjs'],
  { cwd: root, encoding: 'utf8', timeout: 15_000 },
);
if (exploitRegression.error || exploitRegression.signal || exploitRegression.status !== 0) {
  fail(`vendored exploit regression failed\n${exploitRegression.stderr || exploitRegression.stdout}`);
}

const packageRoots = ['services/api', 'admin/web', 'apps/mobile'];
const events = packageRoots.flatMap((packageRoot) => {
  const options = { cwd: path.join(root, packageRoot), encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 };
  const yarnCommand = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
  let audit = spawnSync(yarnCommand, ['audit', '--groups', 'dependencies', '--level', 'high', '--json'], options);
  if (audit.error?.code === 'ENOENT') {
    audit = spawnSync(
      'corepack',
      ['yarn', 'audit', '--groups', 'dependencies', '--level', 'high', '--json'],
      options,
    );
  }
  if (audit.error || audit.status === null) {
    fail(`${packageRoot} registry audit could not run: ${audit.error?.message || 'unknown process failure'}`);
  }

  const packageEvents = audit.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try { return { packageRoot, event: JSON.parse(line) }; } catch { return null; }
    })
    .filter(Boolean);
  if (!packageEvents.some(({ event }) => event.type === 'auditSummary')) {
    fail(`${packageRoot} registry did not return an audit summary${audit.stderr ? `: ${audit.stderr.trim()}` : ''}`);
  }
  return packageEvents;
});

const blocking = events.filter(({ event }) => {
  if (event.type !== 'auditAdvisory') return false;
  return ['high', 'critical'].includes(event.data?.advisory?.severity);
});
const seenMitigations = new Set();

for (const { packageRoot, event } of blocking) {
  const advisory = event.data.advisory;
  const advisoryId = advisory.github_advisory_id;
  const findings = advisory.findings || [];
  const exactMitigation =
    expectedMitigations.has(advisoryId) &&
    packageRoot === 'apps/mobile' &&
    findings.length > 0 &&
    (
      (advisory.module_name === 'image-size' &&
        findings.every((finding) =>
          finding.version === '1.2.1' &&
          finding.paths?.length > 0 &&
          finding.paths.every((dependencyPath) => {
            const segments = dependencyPath.split('>');
            return segments[0] === 'expo' && segments.at(-1) === 'image-size';
          }),
        )) ||
      (advisory.module_name === 'node-forge' &&
        findings.every((finding) =>
          finding.version === '1.4.0' &&
          finding.paths?.length > 0 &&
          finding.paths.every((dependencyPath) => {
            const segments = dependencyPath.split('>');
            return (segments[0] === 'expo' || segments[0] === 'expo-updates') && segments.at(-1) === 'node-forge';
          }),
        )) ||
      (advisory.module_name === 'braces' &&
        findings.every((finding) =>
          finding.version === '3.0.3' &&
          finding.paths?.length > 0 &&
          finding.paths.every((dependencyPath) => {
            const segments = dependencyPath.split('>');
            return segments[0] === 'expo' && segments.at(-1) === 'braces';
          }),
        ))
    );

  if (!exactMitigation) {
    fail(`${packageRoot}: ${advisoryId || advisory.id} (${advisory.module_name}) remains high/critical and is not mitigated`);
  }
  seenMitigations.add(advisoryId);
}

for (const advisoryId of expectedMitigations) {
  if (!seenMitigations.has(advisoryId)) {
    fail(`${advisoryId} disappeared from registry metadata; remove or reassess the vendored patch before proceeding`);
  }
}

process.stdout.write(
  `Security audit passed: no unmitigated high/critical advisories; ${blocking.length} Expo toolchain findings are covered by verified exploit regressions.\n`,
);

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const removedLegacyFiles = [
  'admin/docker-compose.yml',
  'admin/package.json',
  'services/api/src/config/emailConfig.ts',
  'services/api/src/lib/validationMiddleware.ts',
  'apps/mobile/services/api.ts',
  'apps/mobile/services/index.ts',
  'apps/mobile/services/types.ts',
  'apps/mobile/types/media.ts',
];
for (const file of removedLegacyFiles) {
  assert.equal(exists(file), false, `Legacy architecture must not return: ${file}`);
}

const rootPackage = JSON.parse(read('package.json'));
assert.equal(rootPackage.workspaces, undefined, 'Root is an orchestrator, not a partial Yarn workspace');
assert.equal(rootPackage.dependencies, undefined, 'Runtime dependencies belong to deployable applications');

for (const app of ['services/api', 'admin/web', 'apps/mobile']) {
  assert.equal(exists(`${app}/package.json`), true, `${app} must own a package manifest`);
  assert.equal(exists(`${app}/yarn.lock`), true, `${app} must own a reproducible lockfile`);
}

for (const dockerfile of [
  'services/api/Dockerfile',
  'services/api/Dockerfile.dev',
  'admin/web/Dockerfile',
  'admin/web/Dockerfile.dev',
  'apps/mobile/Dockerfile.prod',
  'apps/mobile/Dockerfile.dev',
]) {
  const source = read(dockerfile);
  assert.match(source, /--frozen-lockfile/, `${dockerfile} must use its committed lockfile`);
  assert.doesNotMatch(source, /\|\|\s*(?:CI=true\s+)?yarn install|--no-lockfile/, `${dockerfile} must not fall back to an unpinned install`);
}

const queueFiles = fs.readdirSync(path.join(root, 'services/api/src/queues')).filter((name) => name.endsWith('.ts'));
for (const file of queueFiles) {
  const source = read(`services/api/src/queues/${file}`);
  assert.doesNotMatch(source, /maxRetriesPerRequest|enableAutoPipelining/, `${file} must use infra/bullmq connection policy`);
}

assert.match(read('services/api/src/infra/bullmq.ts'), /maxRetriesPerRequest:\s*null/);
assert.doesNotMatch(read('services/api/src/lib/logger.ts'), /process\.on\(/, 'Shared logger must not own process lifecycle');

process.stdout.write('Architecture boundary contracts passed.\n');

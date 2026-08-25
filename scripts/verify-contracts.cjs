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
  'apps/mobile/lefthook.yml',
  'apps/mobile/scripts/check-all.js',
  'apps/mobile/scripts/check-dependencies.js',
];
for (const file of removedLegacyFiles) {
  assert.equal(exists(file), false, `Legacy architecture must not return: ${file}`);
}

const rootPackage = JSON.parse(read('package.json'));
assert.equal(rootPackage.workspaces, undefined, 'Root is an orchestrator, not a partial Yarn workspace');
assert.equal(rootPackage.dependencies, undefined, 'Runtime dependencies belong to deployable applications');
assert.equal(typeof rootPackage.devDependencies?.lefthook, 'string', 'Root Git hooks must own their Lefthook binary');

for (const app of ['services/api', 'admin/web', 'apps/mobile']) {
  assert.equal(exists(`${app}/package.json`), true, `${app} must own a package manifest`);
  assert.equal(exists(`${app}/yarn.lock`), true, `${app} must own a reproducible lockfile`);
}

for (const dockerfile of [
  'services/api/Dockerfile', 'services/api/Dockerfile.dev',
  'admin/web/Dockerfile', 'admin/web/Dockerfile.dev',
  'apps/mobile/Dockerfile.prod', 'apps/mobile/Dockerfile.dev',
]) {
  const source = read(dockerfile);
  assert.match(source, /--frozen-lockfile/, `${dockerfile} must use its committed lockfile`);
  assert.doesNotMatch(source, /\|\|\s*(?:CI=true\s+)?yarn install|--no-lockfile/, `${dockerfile} must not fall back to an unpinned install`);
}

for (const file of fs.readdirSync(path.join(root, 'services/api/src/queues')).filter((name) => name.endsWith('.ts'))) {
  assert.doesNotMatch(read(`services/api/src/queues/${file}`), /maxRetriesPerRequest|enableAutoPipelining/, `${file} must use infra/bullmq connection policy`);
}
assert.match(read('services/api/src/infra/bullmq.ts'), /maxRetriesPerRequest:\s*null/);
assert.doesNotMatch(read('services/api/src/lib/logger.ts'), /process\.on\(/, 'Shared logger must not own process lifecycle');

const deploy = read('.github/workflows/deploy.yml');
const compose = read('docker-compose.production.yml');
const makefile = read('Makefile');
const position = (source, token) => {
  const index = source.indexOf(token);
  assert.notEqual(index, -1, `Missing deployment contract: ${token}`);
  return index;
};

assert.ok(position(deploy, 'Run admin browser workflows') < position(deploy, 'build-push:'), 'Browser workflows must precede publication');
const capturePrevious = position(deploy, 'previous_image=$(docker inspect');
const deployRelease = position(deploy, 'if ! IMAGE_TAG="$DEPLOY_SHA" make deploy');
const certifyIntegrations = position(deploy, 'if ! IMAGE_TAG="$DEPLOY_SHA" make certify-integrations');
const publicReadiness = position(deploy, 'public_ready=false');
assert.ok(capturePrevious < deployRelease && deployRelease < certifyIntegrations && certifyIntegrations < publicReadiness, 'Deployment transaction order changed');
assert.match(deploy, /\^\[0-9a-f\]\{40\}\$/, 'Rollback tags must be full immutable Git SHAs');
assert.ok((deploy.match(/rollback_previous_release/g) || []).length >= 4, 'Deployment failures must invoke rollback');
assert.match(deploy, /envs:\s+GHCR_DEPLOY_TOKEN,DEPLOY_SHA,API_DOMAIN/);

assert.match(compose, /cgm-api:[\s\S]*?healthcheck:[\s\S]*?\/health/);
assert.match(compose, /claudygod-api:\$\{IMAGE_TAG:\?IMAGE_TAG is required\}/);
assert.doesNotMatch(compose, /IMAGE_TAG:-latest/, 'Production images must be immutable');
const migrateService = compose.match(/\n  migrate:\n([\s\S]*?)\n  cgm-api:/)?.[1] || '';
assert.match(migrateService, /<<: \*database-env/);
assert.doesNotMatch(migrateService, /<<: \*backend-env|depends_on:/);

assert.match(makefile, /^GIT_SHA\s*:=\s*\$\(shell git rev-parse HEAD/m);
assert.match(makefile, /^IMAGE_TAG\s*\?=\s*\$\(GIT_SHA\)/m);
assert.match(makefile, /^export IMAGE_TAG$/m);
for (const source of [deploy, compose]) assert.doesNotMatch(source, /MOBILE_API_KEY/);

process.stdout.write('Architecture and deployment contracts passed.\n');

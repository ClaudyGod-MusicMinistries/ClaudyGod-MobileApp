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
const quality = read('.github/workflows/quality-gate.yml');
const mobileRelease = read('.github/workflows/mobile-store-release.yml');
const compose = read('docker-compose.production.yml');
const makefile = read('Makefile');
const position = (source, token) => {
  const index = source.indexOf(token);
  assert.notEqual(index, -1, `Missing deployment contract: ${token}`);
  return index;
};

const buildPush = position(deploy, '  build-push:');
const deployJob = position(deploy, '  deploy:');
assert.ok(buildPush < deployJob, 'Images must be built before deployment');
assert.match(quality, /workflow_call:/, 'Quality gate must be reusable by production deployment');
assert.match(quality, /push:[\s\S]*?branches:\s*\[develop\]/, 'Standalone quality pushes must be limited to develop');
assert.match(quality, /Run admin browser workflows/, 'Reusable quality gate must retain browser coverage');
for (const workflow of [quality, mobileRelease]) {
  assert.doesNotMatch(workflow, /actions\/setup-node/, 'Workflows must respect the organization action allowlist');
  assert.match(workflow, /bash \.\/scripts\/setup-node-ci\.sh/, 'Workflows must share the repository-owned Node setup');
}
assert.match(deploy, /quality:[\s\S]*?uses:\s*\.\/\.github\/workflows\/quality-gate\.yml[\s\S]*?secrets:\s*inherit/, 'Production must call the reusable quality gate');
assert.match(deploy, /build-push:[\s\S]*?needs:\s*quality/, 'Image publication must wait for quality verification');
assert.match(deploy, /deploy:[\s\S]*?needs:\s*build-push/, 'Deployment must wait for image publication');
assert.match(deploy, /for service in cgm-api worker admin-web mobile-web/, 'Release integrity must cover the background worker');
assert.match(compose, /worker:[\s\S]*?healthcheck:[\s\S]*?claudygod-worker-ready/, 'Worker must publish a real readiness signal');
const coreRollout = position(makefile, 'up -d --remove-orphans --wait cgm-api worker');
const gatewayRollout = position(makefile, 'up -d --remove-orphans --wait admin-web mobile-web');
assert.ok(coreRollout < gatewayRollout, 'API and worker readiness must precede web gateway replacement');
const adminNginx = read('admin/web/nginx.conf');
assert.match(adminNginx, /resolver 127\.0\.0\.11 valid=5s/, 'Admin gateway must promptly refresh Docker DNS');
assert.match(adminNginx, /proxy_next_upstream error timeout http_502 http_503 http_504/, 'Admin gateway must retry transient upstream replacement failures');
const capturePrevious = position(deploy, 'previous_image=$(docker inspect');
const deployRelease = position(deploy, 'if ! IMAGE_TAG="$DEPLOY_SHA" make deploy');
const certifyIntegrations = position(deploy, 'if ! IMAGE_TAG="$DEPLOY_SHA" make certify-integrations');
const publicReadiness = position(deploy, 'public_ready=false');
assert.ok(capturePrevious < deployRelease && deployRelease < certifyIntegrations && certifyIntegrations < publicReadiness, 'Deployment transaction order changed');
assert.match(deploy, /\^\[0-9a-f\]\{40\}\$/, 'Rollback tags must be full immutable Git SHAs');
assert.ok((deploy.match(/rollback_previous_release/g) || []).length >= 4, 'Deployment failures must invoke rollback');
assert.match(deploy, /envs:\s+GHCR_DEPLOY_TOKEN,DEPLOY_SHA,API_DOMAIN/);
assert.doesNotMatch(deploy, /claudygod-(?:api|admin|mobile|postfix):latest/, 'Production must publish only immutable SHA images');
assert.doesNotMatch(makefile, /-t \$\([A-Z_]+IMAGE\):\$\(GIT_SHA\)/, 'Local release builds must not add a duplicate SHA tag');
assert.doesNotMatch(makefile, /docker push .*\$\(GIT_SHA\)/, 'Local releases must not push duplicate image tags');

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

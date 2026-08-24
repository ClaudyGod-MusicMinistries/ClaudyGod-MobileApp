const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const deploy = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
const compose = fs.readFileSync(path.join(root, 'docker-compose.production.yml'), 'utf8');
const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');

function position(source, token) {
  const index = source.indexOf(token);
  assert.notEqual(index, -1, `Missing deployment contract: ${token}`);
  return index;
}

const browserGate = position(deploy, 'Run admin browser workflows');
const imageBuild = position(deploy, 'build-push:');
assert.ok(browserGate < imageBuild, 'Admin browser workflows must run before image publication');

const capturePrevious = position(deploy, 'previous_image=$(docker inspect');
const deployRelease = position(deploy, 'if ! IMAGE_TAG="$DEPLOY_SHA" make deploy');
const certifyIntegrations = position(deploy, 'if ! IMAGE_TAG="$DEPLOY_SHA" make certify-integrations');
const publicReadiness = position(deploy, 'public_ready=false');
assert.ok(capturePrevious < deployRelease, 'Previous immutable release must be captured before rollout');
assert.ok(deployRelease < certifyIntegrations, 'Dependency certification must run after the candidate rollout');
assert.ok(certifyIntegrations < publicReadiness, 'Public readiness must run after dependency certification');

assert.match(deploy, /\^\[0-9a-f\]\{40\}\$/, 'Rollback tags must be full immutable Git SHAs');
const rollbackCalls = deploy.match(/rollback_previous_release/g) || [];
assert.ok(rollbackCalls.length >= 4, 'Deploy, integration, and readiness failures must all invoke rollback');
assert.match(deploy, /envs:\s+GHCR_DEPLOY_TOKEN,DEPLOY_SHA,API_DOMAIN/);

assert.match(compose, /cgm-api:[\s\S]*?healthcheck:[\s\S]*?\/health/);
assert.match(compose, /image: ghcr\.io\/\$\{GHCR_OWNER[^\n]+\}\/claudygod-api:\$\{IMAGE_TAG:\?IMAGE_TAG is required\}/);
assert.doesNotMatch(compose, /IMAGE_TAG:-latest/, 'Production services must never silently deploy mutable latest images');

const migrateService = compose.match(/\n  migrate:\n([\s\S]*?)\n  cgm-api:/)?.[1] || '';
assert.match(migrateService, /<<: \*database-env/, 'Migrations must use the database-only environment');
assert.doesNotMatch(migrateService, /<<: \*backend-env/, 'Migrations must not require the full API environment');
assert.doesNotMatch(migrateService, /depends_on:/, 'Migrations must not wait for unrelated runtime services');

assert.match(makefile, /^GIT_SHA\s*:=\s*\$\(shell git rev-parse HEAD/m);
assert.match(makefile, /^IMAGE_TAG\s*\?=\s*\$\(GIT_SHA\)/m);
assert.match(makefile, /^export IMAGE_TAG$/m);

for (const [name, source] of [['deploy workflow', deploy], ['production compose', compose]]) {
  assert.doesNotMatch(source, /MOBILE_API_KEY/, `${name} must not revive the obsolete public mobile API key`);
}

process.stdout.write('Deployment transaction contracts passed.\n');

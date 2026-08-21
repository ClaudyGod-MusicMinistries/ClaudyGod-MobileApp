const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const deploy = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
const compose = fs.readFileSync(path.join(root, 'docker-compose.production.yml'), 'utf8');

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
assert.match(compose, /image: ghcr\.io\/\$\{GHCR_OWNER[^\n]+\}\/claudygod-api:\$\{IMAGE_TAG:-latest\}/);

process.stdout.write('Deployment transaction contracts passed.\n');

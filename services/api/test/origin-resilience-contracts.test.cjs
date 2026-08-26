const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const apiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(apiRoot, '../..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

test('HTTP Redis and BullMQ producers have bounded retry policies', () => {
  const redis = read('services/api/src/infra/redis.ts');
  const bullmq = read('services/api/src/infra/bullmq.ts');

  assert.match(redis, /maxRetriesPerRequest:\s*1/);
  assert.match(redis, /commandTimeout:\s*2_000/);
  assert.match(bullmq, /bullmqConnection[\s\S]*maxRetriesPerRequest:\s*1/);
  assert.match(bullmq, /bullmqWorkerConnection[\s\S]*maxRetriesPerRequest:\s*null/);
  assert.match(bullmq, /queue\.on\('error'/);
});

test('rate limit storage failures cannot strand authentication requests', () => {
  const limiter = read('services/api/src/middleware/rateLimiter.ts');

  assert.match(limiter, /const passOnStoreError = true/);
  assert.match(limiter, /authLimiter = rateLimit\([\s\S]*?passOnStoreError/);
});

test('health checks and private API proxy return within bounded time', () => {
  const health = read('services/api/src/modules/health/health.routes.ts');
  const nginx = read('admin/web/nginx.conf');

  assert.match(health, /withTimeout\(emailQueue\.getJobCounts\(\), 1_500/);
  assert.match(nginx, /proxy_connect_timeout 3s/);
  assert.match(nginx, /error_page 502 503 504 = @api_unavailable/);
  assert.match(nginx, /"code":"API_UPSTREAM_UNAVAILABLE"/);
});

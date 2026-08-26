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
  assert.match(nginx, /"code":"SERVICE_UNAVAILABLE"/);
});

test('metrics failures are handled and upload security schema is fully migrated', () => {
  const app = read('services/api/src/app.ts');
  const migrate = read('services/api/src/db/migrate.ts');
  const index = read('services/api/src/index.ts');

  assert.match(app, /app\.get\('\/metrics', asyncHandler\(async/);
  for (const column of ['file_size_bytes', 'trust_status', 'scan_result', 'scan_error', 'scanned_at', 'attached_at']) {
    assert.match(migrate, new RegExp(`ALTER TABLE upload_sessions ADD COLUMN IF NOT EXISTS ${column}`));
  }
  assert.match(migrate, /upload_sessions_trust_status_check/);
  assert.match(index, /process\.on\('uncaughtException'/);
  assert.match(index, /process\.on\('unhandledRejection'/);
});

test('silent session refresh preserves MFA and authorization claims', () => {
  const authenticate = read('services/api/src/middleware/authenticate.ts');
  const sessions = read('services/api/src/modules/auth/authSession.service.ts');
  const mfaRoutes = read('services/api/src/modules/auth/mfa.routes.ts');

  assert.match(authenticate, /const sessionUserToClaims[\s\S]*tier: user\.tier,[\s\S]*mfaEnabled: user\.mfaEnabled \|\| mfaVerified,[\s\S]*mfaVerified/);
  assert.equal(
    (authenticate.match(/req\.user = sessionUserToClaims\(session\.user, session\.mfaVerified === true\)/g) ?? []).length,
    2,
  );
  assert.doesNotMatch(authenticate, /req\.user = \{[\s\S]*?session\.user\.displayName/);
  assert.match(sessions, /mfa_verified = TRUE[\s\S]*refresh_token_hash = \$3/);
  assert.match(mfaRoutes, /verifyMfaSetup[\s\S]*markRefreshSessionMfaVerified/);
});

test('OTP throttling uses HTTP 429 with an exact server-driven retry window', () => {
  const otp = read('services/api/src/modules/auth/emailOtp.service.ts');
  const errors = read('services/api/src/lib/errors.ts');
  const errorHandler = read('services/api/src/middleware/errorHandler.ts');
  const apiError = read('admin/web/src/api/apiError.ts');
  const login = read('admin/web/src/views/auth/LoginView.vue');
  const limiter = read('services/api/src/middleware/rateLimiter.ts');
  const authRoutes = read('services/api/src/modules/auth/auth.routes.ts');

  assert.match(errors, /class TooManyRequestsError[\s\S]*super\(429/);
  assert.match(otp, /MIN\(created_at\) AS first_created_at/);
  assert.match(otp, /throw new TooManyRequestsError/);
  assert.match(errorHandler, /setHeader\('Retry-After'/);
  assert.match(apiError, /retryAfterSeconds/);
  assert.match(login, /startResendCooldown\(apiError\.retryAfterSeconds\)/);
  assert.match(limiter, /mfaChallengeLimiter[\s\S]*createHash\('sha256'\)/);
  assert.match(authRoutes, /'\/mfa\/verify',[\s\S]*mfaChallengeLimiter/);
  assert.match(authRoutes, /'\/mfa\/resend',[\s\S]*mfaChallengeLimiter/);
});

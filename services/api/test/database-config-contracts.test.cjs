const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');

const apiRoot = path.resolve(__dirname, '..');

test('database tooling starts with database-only production configuration', () => {
  const result = spawnSync(
    process.execPath,
    ['-e', "require('./dist/db/pool').closePool().then(() => process.exit(0))"],
    {
      cwd: apiRoot,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'production',
        CLAUDYGOD_ENV: 'production',
        DATABASE_URL: 'postgresql://migration:test@database.internal:5432/app',
        DATABASE_SSL: 'false',
      },
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stderr, /MOBILE_API_KEY|JWT_ACCESS_SECRET|REDIS_URL/);
});

test('database tooling rejects a malformed explicit CA bundle', () => {
  const result = spawnSync(
    process.execPath,
    ['-e', "require('./dist/db/pool')"],
    {
      cwd: apiRoot,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'production',
        CLAUDYGOD_ENV: 'production',
        DATABASE_URL: 'postgresql://migration:test@database.internal:5432/app',
        DATABASE_SSL: 'true',
        DATABASE_SSL_REJECT_UNAUTHORIZED: 'true',
        DATABASE_SSL_CA_BASE64: Buffer.from('not a PEM certificate').toString('base64'),
      },
      encoding: 'utf8',
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must decode to a PEM certificate chain/);
});

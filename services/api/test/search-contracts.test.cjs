const test = require('node:test');
const assert = require('node:assert/strict');

const {
  decodeSearchCursor,
  encodeSearchCursor,
  normalizeSearchText,
} = require('../dist/modules/search/search.contracts.js');

test('search text normalization is deterministic and bounded', () => {
  assert.equal(normalizeSearchText('  grace   and\ntruth  '), 'grace and truth');
  assert.equal(normalizeSearchText('x'.repeat(250)).length, 200);
});

test('search cursor round-trips every deterministic ordering field', () => {
  const cursor = {
    rank: 0.75,
    createdAt: '2026-08-18T04:00:00.000Z',
    id: '11111111-1111-4111-8111-111111111111',
  };
  assert.deepEqual(decodeSearchCursor(encodeSearchCursor(cursor)), cursor);
});

test('search cursor rejects malformed or incomplete input', () => {
  assert.throws(() => decodeSearchCursor('not-a-cursor'), /Invalid search cursor/);
  const missingRank = Buffer.from(JSON.stringify({
    createdAt: '2026-08-18T04:00:00.000Z',
    id: '11111111-1111-4111-8111-111111111111',
  })).toString('base64url');
  assert.throws(() => decodeSearchCursor(missingRank), /Invalid search cursor/);
});

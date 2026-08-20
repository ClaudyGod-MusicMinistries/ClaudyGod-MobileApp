const assert = require('node:assert/strict');

const { closePool, pool } = require('../dist/db/pool.js');
const { getTrendingSearches, pruneExpiredSearchEvents, searchContent } = require('../dist/modules/search/search.service.js');
const { getMeLibrary, removeMeLibraryItem, saveMeLibraryItem } = require('../dist/modules/me/me.service.js');

async function run() {
  const first = await searchContent({ q: 'worship', limit: 1 });
  assert.equal(first.items.length, 1);
  assert.equal(first.hasMore, true);
  assert.ok(first.nextCursor);

  const second = await searchContent({ q: 'worship', limit: 1, cursor: first.nextCursor });
  assert.equal(second.items.length, 1);
  assert.notEqual(second.items[0].id, first.items[0].id);

  const live = await searchContent({ q: 'evening prayer', type: 'live', limit: 10 });
  assert.equal(live.items.length, 1);
  assert.equal(live.items[0].contentType, 'live');

  // Repeating the request proves anonymous searches are consistently logged
  // for accurate trending aggregation.
  const repeated = await searchContent({ q: 'evening prayer', type: 'live', limit: 10 });
  assert.deepEqual(repeated.items, live.items);

  const trending = await getTrendingSearches(8);
  assert.ok(trending.items.some((item) => item.query === 'evening prayer' && item.count >= 2));

  await pool.query(
    `INSERT INTO user_search_events (query, results_count, searched_at)
     VALUES ('expired query', 1, NOW() - INTERVAL '91 days')`,
  );
  assert.equal(await pruneExpiredSearchEvents(), 1);

  const owner = {
    sub: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    email: 'integration@example.com', displayName: 'Integration Author', role: 'ADMIN',
  };
  await saveMeLibraryItem(owner, {
    bucket: 'liked', contentId: 'library-contract-item', contentType: 'audio', title: 'Library Contract',
  });
  await saveMeLibraryItem(owner, {
    bucket: 'liked', contentId: 'library-contract-item', contentType: 'audio', title: 'Library Contract Updated',
  });
  const ownerLibrary = await getMeLibrary(owner);
  assert.equal(ownerLibrary.liked.filter((item) => item.id === 'library-contract-item').length, 1);
  assert.equal(ownerLibrary.liked.find((item) => item.id === 'library-contract-item').title, 'Library Contract Updated');

  const otherUser = {
    sub: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    email: 'other@example.com', displayName: 'Other User', role: 'CLIENT',
  };
  await saveMeLibraryItem(otherUser, {
    bucket: 'liked', contentId: 'other-item', contentType: 'video', title: 'Other Item',
  });
  assert.equal((await getMeLibrary(otherUser)).liked.some((item) => item.id === 'library-contract-item'), false);
  assert.equal((await removeMeLibraryItem(otherUser, { bucket: 'liked', contentId: 'library-contract-item' })).removed, false);
  assert.equal((await removeMeLibraryItem(owner, { bucket: 'liked', contentId: 'library-contract-item' })).removed, true);
}

run()
  .then(async () => {
    process.stdout.write('Search and library service integration passed.\n');
    await closePool();
    process.exit(0);
  })
  .catch(async (error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    await closePool().catch(() => undefined);
    process.exit(1);
  });

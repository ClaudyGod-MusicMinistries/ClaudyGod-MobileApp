const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveDeletionSchedule,
  daysUntil,
  canCancelDeletion,
  ACCOUNT_DELETION_GRACE_DAYS,
} = require('../dist/modules/me/accountDeletion.contracts.js');

const DAY = 24 * 60 * 60 * 1000;

test('deletion is scheduled a whole grace period in the future', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const scheduled = resolveDeletionSchedule(now, 30);
  assert.equal(scheduled.getTime() - now.getTime(), 30 * DAY);
  // default grace period is a sane, bounded value
  assert.ok(ACCOUNT_DELETION_GRACE_DAYS >= 0 && ACCOUNT_DELETION_GRACE_DAYS <= 90);
});

test('resolveDeletionSchedule floors fractional and rejects negative grace days', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  assert.equal(resolveDeletionSchedule(now, 7.9).getTime() - now.getTime(), 7 * DAY);
  assert.equal(resolveDeletionSchedule(now, -5).getTime() - now.getTime(), 30 * DAY);
  assert.equal(resolveDeletionSchedule(now, 0).getTime(), now.getTime());
});

test('daysUntil never goes negative and rounds up partial days', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  assert.equal(daysUntil(new Date(now.getTime() + 30 * DAY), now), 30);
  assert.equal(daysUntil(new Date(now.getTime() + 1.2 * DAY), now), 2);
  assert.equal(daysUntil(new Date(now.getTime() - DAY), now), 0);
});

test('a deletion can be cancelled only while scheduled and still in the future', () => {
  const now = new Date('2026-01-15T00:00:00.000Z');
  const future = new Date(now.getTime() + 5 * DAY);
  const past = new Date(now.getTime() - DAY);
  assert.equal(canCancelDeletion('scheduled', future, now), true);
  assert.equal(canCancelDeletion('scheduled', past, now), false);
  assert.equal(canCancelDeletion('processing', future, now), false);
  assert.equal(canCancelDeletion('completed', future, now), false);
  assert.equal(canCancelDeletion('cancelled', future, now), false);
});

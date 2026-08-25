const test = require('node:test');
const assert = require('node:assert/strict');
const { createDonationIntentSchema } = require('../dist/modules/me/me.schema.js');

const futureDate = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7);
  return date;
};

const dateKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

const base = { amount: '25.00', currency: 'USD', methodId: 'bank', clientReference: 'giving:test:reference-001' };

test('recurring giving requires a bounded schedule matching its start date', () => {
  const start = futureDate();
  const weekly = createDonationIntentSchema.safeParse({
    ...base,
    mode: 'weekly',
    schedule: {
      startDate: dateKey(start),
      timezone: 'Africa/Lagos',
      recurrenceDay: start.getUTCDay(),
    },
  });
  assert.equal(weekly.success, true);

  assert.equal(createDonationIntentSchema.safeParse({ ...base, mode: 'weekly' }).success, false);
  assert.equal(createDonationIntentSchema.safeParse({
    ...base,
    mode: 'weekly',
    schedule: { startDate: dateKey(start), timezone: 'Africa/Lagos', recurrenceDay: (start.getUTCDay() + 1) % 7 },
  }).success, false);
});

test('one-time giving rejects recurrence data', () => {
  const start = futureDate();
  assert.equal(createDonationIntentSchema.safeParse({ ...base, mode: 'once' }).success, true);
  assert.equal(createDonationIntentSchema.safeParse({
    ...base,
    mode: 'once',
    schedule: { startDate: dateKey(start), timezone: 'Africa/Lagos', recurrenceDay: start.getUTCDay() },
  }).success, false);
});

test('giving requires explicit currency and a bounded idempotency reference', () => {
  assert.equal(createDonationIntentSchema.safeParse({ ...base, mode: 'once', currency: undefined }).success, false);
  assert.equal(createDonationIntentSchema.safeParse({ ...base, mode: 'once', clientReference: 'short' }).success, false);
  assert.equal(createDonationIntentSchema.safeParse({ ...base, mode: 'once', metadata: { source: 'mobile', unexpected: true } }).success, false);
});

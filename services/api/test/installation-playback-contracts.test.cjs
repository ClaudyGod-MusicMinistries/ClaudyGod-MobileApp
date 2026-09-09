const test = require('node:test');
const assert = require('node:assert/strict');

const {
  installationPlaybackPositionSchema,
  resolveResumePoint,
  RESUME_MIN_POSITION_MS,
  RESUME_END_GRACE_MS,
} = require('../dist/modules/mobile/installation.contracts.js');

test('playback position payload is strict and bounded', () => {
  const ok = installationPlaybackPositionSchema.parse({
    contentId: 'content_123',
    positionMs: 42_000,
    durationMs: 2_700_000,
  });
  assert.equal(ok.positionMs, 42_000);

  assert.throws(() => installationPlaybackPositionSchema.parse({
    contentId: 'x', positionMs: -1, durationMs: 0,
  }));
  assert.throws(() => installationPlaybackPositionSchema.parse({
    contentId: 'x', positionMs: 0, durationMs: 0, extra: true,
  }), /Unrecognized key|unrecognized_keys/i);
  assert.throws(() => installationPlaybackPositionSchema.parse({
    contentId: '', positionMs: 0, durationMs: 0,
  }));
});

test('resolveResumePoint ignores positions before playback has really started', () => {
  assert.equal(resolveResumePoint(0, 300_000), null);
  assert.equal(resolveResumePoint(RESUME_MIN_POSITION_MS - 1, 300_000), null);
  assert.equal(resolveResumePoint(RESUME_MIN_POSITION_MS, 300_000), RESUME_MIN_POSITION_MS);
});

test('resolveResumePoint clears the resume point once a track is effectively finished', () => {
  const duration = 300_000;
  assert.equal(resolveResumePoint(duration - RESUME_END_GRACE_MS, duration), null);
  assert.equal(resolveResumePoint(duration - RESUME_END_GRACE_MS - 1_000, duration), duration - RESUME_END_GRACE_MS - 1_000);
  assert.equal(resolveResumePoint(duration + 10_000, duration), null);
});

test('resolveResumePoint tolerates an unknown duration and floors fractional input', () => {
  assert.equal(resolveResumePoint(90_000.7, 0), 90_000);
  assert.equal(resolveResumePoint(Number.NaN, 0), null);
});

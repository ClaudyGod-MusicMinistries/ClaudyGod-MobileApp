const test = require('node:test');
const assert = require('node:assert/strict');
const { CAPABILITIES, ROLE_CAPABILITIES, hasCapability } = require('../dist/security/capabilities.js');

test('capability bundles are explicit, immutable, and least-privilege ordered', () => {
  assert.equal(hasCapability('CLIENT', 'content.manage'), false);
  assert.equal(hasCapability('CREATOR', 'security.self_manage'), true);
  assert.equal(hasCapability('MODERATOR', 'analytics.read'), true);
  assert.equal(hasCapability('MODERATOR', 'content.publish'), false);
  assert.equal(hasCapability('ADMIN', 'content.publish'), true);
  assert.equal(hasCapability('ADMIN', 'operations.manage'), false);
  assert.equal(hasCapability('SUPER_ADMIN', 'operations.manage'), true);
  assert.deepEqual([...ROLE_CAPABILITIES.SUPER_ADMIN].sort(), [...CAPABILITIES].sort());
  assert.equal(new Set(CAPABILITIES).size, CAPABILITIES.length);
});

test('every role bundle contains only catalogue capabilities', () => {
  const catalogue = new Set(CAPABILITIES);
  for (const capabilities of Object.values(ROLE_CAPABILITIES)) {
    for (const capability of capabilities) assert.equal(catalogue.has(capability), true);
  }
});

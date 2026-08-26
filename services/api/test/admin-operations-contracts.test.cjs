const test = require('node:test');
const assert = require('node:assert/strict');

const {
  operationalJobsQuerySchema,
  operationalJobParamsSchema,
  securityAuditQuerySchema,
} = require('../dist/modules/admin/admin.schema.js');
const { requirePrivilegedMfa } = require('../dist/middleware/requirePrivilegedMfa.js');

test('operational job inputs are bounded and reject unknown fields', () => {
  assert.deepEqual(operationalJobsQuerySchema.parse({ status: 'failed', limit: '50' }), { status: 'failed', limit: 50 });
  assert.deepEqual(operationalJobParamsSchema.parse({ kind: 'content', id: '42' }), { kind: 'content', id: 42 });
  assert.throws(() => operationalJobsQuerySchema.parse({ status: 'unknown' }));
  assert.throws(() => operationalJobParamsSchema.parse({ kind: 'email', id: '-1' }));
  assert.throws(() => securityAuditQuerySchema.parse({ limit: 20, includeSecrets: true }));
});

test('privileged access requires a verified MFA claim', () => {
  const next = () => undefined;
  assert.throws(
    () => requirePrivilegedMfa({ user: { role: 'ADMIN', mfaEnabled: false, mfaVerified: false } }, {}, next),
    (error) => error?.code === 'MFA_ENROLLMENT_REQUIRED',
  );
  assert.throws(
    () => requirePrivilegedMfa({ user: { role: 'ADMIN', mfaEnabled: true, mfaVerified: false } }, {}, next),
    (error) => error?.code === 'MFA_VERIFICATION_REQUIRED',
  );
  assert.doesNotThrow(() => requirePrivilegedMfa({ user: { role: 'ADMIN', mfaEnabled: true, mfaVerified: true } }, {}, next));
  assert.doesNotThrow(() => requirePrivilegedMfa({ user: { role: 'CLIENT', mfaEnabled: false } }, {}, next));
});

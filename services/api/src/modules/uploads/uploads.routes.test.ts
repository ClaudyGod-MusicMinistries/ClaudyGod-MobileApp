import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../utils/jwt.js';
import type { UserRole } from '../auth/auth.types.js';

function tokenFor(role: UserRole): string {
  return signAccessToken({
    sub: `test-${role.toLowerCase()}`,
    email: `${role.toLowerCase()}@example.com`,
    role,
    displayName: `Test ${role}`,
  });
}

describe('GET /v1/uploads/policies', () => {
  const app = createApp();

  // Regression test: uploads.routes.ts used to check `role !== 'ADMIN'` directly,
  // which incorrectly rejected SUPER_ADMIN accounts with a 403.
  it('allows a SUPER_ADMIN account', async () => {
    const res = await request(app)
      .get('/v1/uploads/policies')
      .set('Authorization', `Bearer ${tokenFor('SUPER_ADMIN')}`);
    expect(res.status).toBe(200);
  });

  it('allows an ADMIN account', async () => {
    const res = await request(app)
      .get('/v1/uploads/policies')
      .set('Authorization', `Bearer ${tokenFor('ADMIN')}`);
    expect(res.status).toBe(200);
  });

  it('rejects a CLIENT account', async () => {
    const res = await request(app)
      .get('/v1/uploads/policies')
      .set('Authorization', `Bearer ${tokenFor('CLIENT')}`);
    expect(res.status).toBe(403);
  });

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/v1/uploads/policies');
    expect(res.status).toBe(401);
  });
});

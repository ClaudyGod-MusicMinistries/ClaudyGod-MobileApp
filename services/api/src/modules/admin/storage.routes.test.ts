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

// This is the S3-backed upload pipeline that replaced the old Supabase-signed-URL
// pipeline (services/api/src/modules/uploads/, deleted). Its role gate
// (requireAdminActor, in storage.routes.ts) uses hasMinRole — this is a regression test
// for the same class of bug fixed elsewhere: a SUPER_ADMIN must never be locked out of
// an ADMIN-gated route. S3 isn't configured in this test environment, so an authorized
// caller gets a 503 (S3_NOT_CONFIGURED) once past the role gate — the meaningful
// assertion is that authorized roles are never rejected with 401/403.
describe('POST /v1/admin/storage/confirm', () => {
  const app = createApp();
  const body = { sessionId: '00000000-0000-0000-0000-000000000000' };

  it('lets a SUPER_ADMIN account past the role gate', async () => {
    const res = await request(app)
      .post('/v1/admin/storage/confirm')
      .set('Authorization', `Bearer ${tokenFor('SUPER_ADMIN')}`)
      .send(body);
    expect([401, 403]).not.toContain(res.status);
  });

  it('lets an ADMIN account past the role gate', async () => {
    const res = await request(app)
      .post('/v1/admin/storage/confirm')
      .set('Authorization', `Bearer ${tokenFor('ADMIN')}`)
      .send(body);
    expect([401, 403]).not.toContain(res.status);
  });

  it('rejects a CLIENT account at the role gate', async () => {
    const res = await request(app)
      .post('/v1/admin/storage/confirm')
      .set('Authorization', `Bearer ${tokenFor('CLIENT')}`)
      .send(body);
    expect(res.status).toBe(403);
  });

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).post('/v1/admin/storage/confirm').send(body);
    expect(res.status).toBe(401);
  });
});

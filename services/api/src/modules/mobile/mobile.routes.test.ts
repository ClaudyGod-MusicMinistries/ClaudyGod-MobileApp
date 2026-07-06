import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../utils/jwt.js';

describe('POST /v1/mobile/uploads/signed-url', () => {
  const app = createApp();

  // Regression test: this route used to let any authenticated CLIENT request a
  // storage-write URL directly. It has been removed — mobile end-users must never be
  // able to request upload URLs; only admins (via admin/web's storage pipeline) can.
  it('no longer exists for any caller, authenticated or not', async () => {
    const token = signAccessToken({
      sub: 'test-client',
      email: 'client@example.com',
      role: 'CLIENT',
      displayName: 'Test Client',
    });

    const authed = await request(app)
      .post('/v1/mobile/uploads/signed-url')
      .set('Authorization', `Bearer ${token}`)
      .send({ fileName: 'x.jpg', mimeType: 'image/jpeg' });
    expect(authed.status).toBe(404);

    const anonymous = await request(app).post('/v1/mobile/uploads/signed-url').send({});
    expect(anonymous.status).toBe(404);
  });
});

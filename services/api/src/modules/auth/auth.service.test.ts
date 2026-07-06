import { registerUser } from './auth.service.js';

// Regression test for the silent role-downgrade bug: `registerUser` used to map any
// non-'ADMIN' requested role (including 'SUPER_ADMIN' or garbage strings) straight to
// 'CLIENT' with no error, even though the admin UI offers MODERATOR/CREATOR self-signup
// with a code. It must now reject a role it won't self-register instead of silently
// downgrading. This check runs before any database access, so it's safe to assert
// without a live Postgres connection.
describe('registerUser role validation', () => {
  it('rejects SUPER_ADMIN as a self-registerable role', async () => {
    await expect(
      registerUser({
        email: 'nobody@example.com',
        password: 'irrelevant',
        username: 'Nobody',
        role: 'SUPER_ADMIN',
        adminSignupCode: 'whatever-code',
      }),
    ).rejects.toThrow();
  });
});

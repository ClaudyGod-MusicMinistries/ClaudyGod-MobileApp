import { expect, test, type Page, type Route } from '@playwright/test';

const admin = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'owner@claudygod.test',
  displayName: 'Platform Owner',
  role: 'SUPER_ADMIN',
  mfaEnabled: true,
  mfaVerified: true,
};

const json = (route: Route, body: unknown, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

async function mockAuthenticatedSession(page: Page): Promise<void> {
  await page.route('**/health', (route) => json(route, { status: 'ok', services: {} }));
  await page.route('**/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/v1/auth/session')) return json(route, { authenticated: true, user: admin });
    if (path.endsWith('/v1/admin/storage/health')) return json(route, {
      configured: true, reachable: true, bucket: 'mobile-uploads', endpointHost: 'storage.test',
      sessions: { issued: 1, uploaded: 8, expired: 2, failed: 1 }, lastConfirmedAt: new Date().toISOString(), detail: 'Bucket reachable.',
    });
    if (path.endsWith('/v1/admin/operations/jobs')) return json(route, { jobs: [{
      id: '42', kind: 'media', type: 'security.scan', status: 'failed', summary: 'sermon.mp3',
      error: 'Scanner unavailable', createdAt: new Date().toISOString(), processedAt: null,
    }] });
    if (path.endsWith('/v1/admin/operations/jobs/media/42/retry')) return json(route, { dispatch: 'queued' });
    if (path.endsWith('/v1/admin/operations/audit')) return json(route, { events: [] });
    if (path.endsWith('/health')) return json(route, { status: 'ok', services: {} });
    return json(route, {});
  });
}

test('admin authentication requires MFA before workspace access', async ({ page }) => {
  await page.route('**/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/v1/auth/session')) return json(route, { authenticated: false, user: null });
    if (path.endsWith('/v1/auth/login')) return json(route, { mfaRequired: true, mfaToken: 'bounded-test-token' });
    if (path.endsWith('/v1/auth/mfa/verify')) return json(route, { user: admin });
    return json(route, {});
  });

  await page.goto('/login');
  await page.getByLabel('Email address').fill(admin.email);
  await page.getByLabel('Password').fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Verification code' })).toBeVisible();
  await page.getByLabel('Security code').fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page).toHaveURL(/\/choose-workspace$/);
  await expect(page.getByRole('heading', { name: 'Which workspace do you need?' })).toBeVisible();
});

test('super admin can see and retry a failed media security job', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await page.goto('/system');
  await expect(page.getByText('sermon.mp3')).toBeVisible();
  await expect(page.getByText('Scanner unavailable')).toBeVisible();
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('sermon.mp3')).toBeVisible();
});

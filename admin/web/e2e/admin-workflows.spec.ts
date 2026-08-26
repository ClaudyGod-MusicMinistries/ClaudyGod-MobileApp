import { expect, test, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    if (path.endsWith('/v1/admin/operations/sessions')) return json(route, { sessions: [{
      id: '22222222-2222-4222-8222-222222222222', source: 'refresh', userId: admin.id,
      email: admin.email, displayName: admin.displayName, role: admin.role, ipAddress: '203.0.113.10',
      userAgent: 'Release browser', createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    }] });
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

test('workspace chooser routes independently to mobile and web studios', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await page.goto('/choose-workspace');

  await page.getByRole('button', { name: /Mobile Studio/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('link', { name: 'Switch workspace' })).toBeVisible();

  await page.getByRole('link', { name: 'Switch workspace' }).click();
  await page.getByRole('button', { name: /Web Studio/ }).click();
  await expect(page).toHaveURL(/\/web\/dashboard$/);
  await expect(page.getByRole('link', { name: 'Switch workspace' })).toBeVisible();
});

test('session discovery avoids preflight-only headers and MFA setup submits once', async ({ page }) => {
  const enrollingAdmin = { ...admin, mfaEnabled: false, mfaVerified: false };
  let sessionHeaders: Record<string, string> = {};
  let verificationRequests = 0;

  await page.route('**/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/v1/auth/session')) {
      sessionHeaders = route.request().headers();
      return json(route, { authenticated: true, user: enrollingAdmin });
    }
    if (path.endsWith('/v1/auth/mfa/setup')) {
      return json(route, { delivery: 'email', maskedEmail: 'ow***@claudygod.test', expiresInMinutes: 10 });
    }
    if (path.endsWith('/v1/auth/mfa/verify-setup')) {
      verificationRequests += 1;
      return json(route, { codes: ['A1B2C3D4'] });
    }
    if (path.endsWith('/v1/auth/refresh')) return json(route, { user: admin });
    return json(route, {});
  });

  await page.goto('/security');
  expect(sessionHeaders['content-type']).toBeUndefined();
  expect(sessionHeaders['x-request-id']).toBeUndefined();
  expect(sessionHeaders['x-claudy-client-platform']).toBeUndefined();

  await page.getByRole('button', { name: 'Send verification code' }).click();
  await expect(page.getByText(/ow\*\*\*@claudygod\.test/)).toBeVisible();
  await page.getByLabel('Verification code').fill('123456');
  await page.getByRole('button', { name: 'Verify and enable MFA' }).click();
  await expect(page.getByText('A1B2C3D4')).toBeVisible();
  expect(verificationRequests).toBe(1);
});

test('super admin can see and retry a failed media security job', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await page.goto('/system');
  await expect(page.getByText('sermon.mp3')).toBeVisible();
  await expect(page.getByText('Scanner unavailable')).toBeVisible();
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('sermon.mp3')).toBeVisible();
  await expect(page.getByText('203.0.113.10')).toBeVisible();
  await page.getByRole('button', { name: 'Revoke' }).click();
  await page.getByRole('button', { name: 'Revoke session' }).click();
  await expect(page.getByText('203.0.113.10')).not.toBeVisible();
});

test('public authentication surface has no WCAG A/AA violations', async ({ page }) => {
  await page.route('**/v1/auth/session', (route) => json(route, { authenticated: false, user: null }));
  await page.goto('/login');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test('initial admin shell stays inside the browser performance budget', async ({ page }) => {
  await mockAuthenticatedSession(page);
  const scriptBytes: number[] = [];
  page.on('response', async (response) => {
    if (response.request().resourceType() !== 'script') return;
    const header = response.headers()['content-length'];
    if (header) scriptBytes.push(Number(header));
  });
  await page.goto('/system');
  await expect(page.getByRole('heading', { name: 'System health' })).toBeVisible();
  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return { domContentLoadedMs: entry.domContentLoadedEventEnd - entry.startTime };
  });
  expect(navigation.domContentLoadedMs).toBeLessThan(2500);
  expect(scriptBytes.reduce((sum, bytes) => sum + bytes, 0)).toBeLessThan(750 * 1024);
});

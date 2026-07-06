import { APP_ROUTES, APP_ROUTE_BY_ID, TAB_ROUTE_BY_ID } from './appRoutes';

// Guards the shape of APP_ROUTES as the progressive auth rollout (see
// features/auth/README.md) incrementally uncomments auth/profile/accountSecurity
// entries batch by batch — this should keep passing across every batch, and fail loudly
// if a route path is ever accidentally renamed out from under a live navigation call.
describe('APP_ROUTES', () => {
  it('keeps every live tab route as a non-empty string', () => {
    Object.values(APP_ROUTES.tabs).forEach((path) => {
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    });
  });

  it('keeps every live settings page route as a non-empty string', () => {
    Object.values(APP_ROUTES.settingsPages).forEach((path) => {
      expect(typeof path).toBe('string');
      expect(path.startsWith('/settingsPage/')).toBe(true);
    });
  });

  it('still reserves the not-yet-routable auth/profile entries (batched rollout)', () => {
    expect(APP_ROUTES.auth.signIn).toBe('/sign-in');
    expect(APP_ROUTES.auth.signUp).toBe('/sign-up');
    expect(APP_ROUTES.profile).toBe('/profile');
    expect(APP_ROUTES.accountSecurity).toBe('/account-security');
  });

  it('keeps TAB_ROUTE_BY_ID and APP_ROUTE_BY_ID in sync with APP_ROUTES.tabs', () => {
    expect(TAB_ROUTE_BY_ID.home).toBe(APP_ROUTES.tabs.home);
    expect(APP_ROUTE_BY_ID['tabs.home']).toBe(APP_ROUTES.tabs.home);
    expect(APP_ROUTE_BY_ID.profile).toBe(APP_ROUTES.profile);
  });
});

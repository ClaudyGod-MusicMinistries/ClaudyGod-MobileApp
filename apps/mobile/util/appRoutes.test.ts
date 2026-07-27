import { APP_ROUTES, APP_ROUTE_BY_ID, TAB_ROUTE_BY_ID } from './appRoutes';

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

  it('keeps TAB_ROUTE_BY_ID and APP_ROUTE_BY_ID in sync with APP_ROUTES.tabs', () => {
    expect(TAB_ROUTE_BY_ID.home).toBe(APP_ROUTES.tabs.home);
    expect(APP_ROUTE_BY_ID['tabs.home']).toBe(APP_ROUTES.tabs.home);
  });
});

import { mobileAppConfigSchema } from './appConfig.schema.js';
import { DEFAULT_MOBILE_APP_CONFIG } from './appConfig.defaults.js';

// Pure schema validation — no database access, safe to assert directly (see
// auth.service.test.ts for the same convention). Regression guard: catches a
// default value that doesn't satisfy its own schema (e.g. a new required
// array left below its min-items bound) before it ever reaches a live DB.
describe('DEFAULT_MOBILE_APP_CONFIG', () => {
  it('satisfies mobileAppConfigSchema', () => {
    expect(() => mobileAppConfigSchema.parse(DEFAULT_MOBILE_APP_CONFIG)).not.toThrow();
  });

  it('has referral howItWorks/rewardTiers and donate scriptures populated', () => {
    expect(DEFAULT_MOBILE_APP_CONFIG.referral.howItWorks.length).toBeGreaterThan(0);
    expect(DEFAULT_MOBILE_APP_CONFIG.referral.rewardTiers.length).toBeGreaterThan(0);
    expect(DEFAULT_MOBILE_APP_CONFIG.donate.scriptures.length).toBeGreaterThan(0);
  });
});

import Constants from 'expo-constants';

/**
 * App-level constants that are not environment configuration (those live in
 * `services/config.ts`) and not design tokens (those live in `constants/color.ts`
 * / `theme/`). This is the single home for literals that were previously inlined
 * across services, hooks and components — network budgets, third-party endpoints,
 * and the public web domain the app deep-links to.
 *
 * Native deep-link registration (iOS `associatedDomains`, Android `intentFilters`)
 * is declared separately in `app.config.js` because that file runs before the
 * TypeScript layer exists. Keep `DEEP_LINK.domain` / `DEEP_LINK.referralPath`
 * below in sync with the `claudygod.org` / `/join` entries there.
 */

export const DEEP_LINK = {
  /** Public web domain that also hosts universal / app links. */
  domain: 'claudygod.org',
  /** Path that resolves the referral join flow on web and in-app. */
  referralPath: '/join',
} as const;

/** Base URL for referral share links, e.g. `https://claudygod.org/join?ref=ABC123`. */
export const REFERRAL_SHARE_BASE_URL = `https://${DEEP_LINK.domain}${DEEP_LINK.referralPath}`;

export const HTTP = {
  /** Default abort budget for first-party API requests (`apiClient`). */
  defaultTimeoutMs: 30_000,
  /** Abort budget for the (slower, third-party) Bible verse lookup. */
  bibleTimeoutMs: 15_000,
} as const;

export const THIRD_PARTY = {
  /** bible-api.com — free, no key. Used only for the daily Word of the Day. */
  bibleApiBaseUrl: 'https://bible-api.com',
  bibleTranslation: 'kjv',
} as const;

/**
 * Semantic version of the shipped app, sourced from the native build metadata
 * (`app.config.js` → `version`) rather than a hand-maintained literal, so the
 * `X-Claudy-Client-Version` header never drifts from the store build.
 */
export const CLIENT_VERSION: string =
  Constants.expoConfig?.version ??
  (Constants.manifest as { version?: string } | null | undefined)?.version ??
  '0.0.0';

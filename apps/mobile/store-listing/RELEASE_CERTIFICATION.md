# Mobile store release certification

Run `yarn release:certify` from `apps/mobile` using the exact production EAS environment. A release is not approved when the command reports any blocker.

The gate verifies:

- real HTTPS API, Supabase, and Sentry configuration;
- non-placeholder public Supabase credentials;
- matching approved iOS and Android application identity;
- deterministic runtime version and EAS Updates configuration;
- 1024×1024 PNG release artwork;
- real-device screenshots for the required core journeys;
- recorded privacy, content-rating, and release smoke-test evidence.

Do not use generated mockups as store screenshots. Capture the installed production candidate on the target device profiles after the backend integration checks pass.

External evidence still required before submission:

1. App Store Connect application record, agreements, tax/banking status, APNs credential, and signing verification.
2. Google Play Console application record, Play App Signing, service account, Data safety form, and content rating.
3. Public verification of privacy, terms, support, and account-deletion URLs from outside the production network.
4. A successful production EAS build for both platforms and smoke tests on physical iOS and Android devices.
5. Reviewer credentials or review notes if any reviewed feature requires authentication.

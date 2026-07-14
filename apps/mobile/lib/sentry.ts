import * as Sentry from '@sentry/react-native';
import { ENV } from '../services/config';
import { getPreference } from './localUserStorage';

// Runs as soon as this module is imported — keep the import of this file first in
// app/_layout.tsx so Sentry is live before any other module's top-level code runs.
if (ENV.sentryDsn) {
  Sentry.init({
    dsn: ENV.sentryDsn,
    environment: ENV.runtimeMode,
    tracesSampleRate: 0.2,
  });
}

export const isSentryEnabled = (): boolean => Boolean(ENV.sentryDsn);

// The user's "diagnostics" preference (settings.tsx) controls whether we're actually
// allowed to send anything, independent of whether Sentry is configured. Read from
// local storage at boot as a synchronous best-effort cache — settings.tsx keeps this
// mirrored locally for both guests and signed-in users so this check never needs to
// be async. Defaults to allowed until the real value loads, same as every other
// best-effort preference read in this codebase.
let diagnosticsAllowed = true;
void getPreference('diagnosticsEnabled', true).then((value) => { diagnosticsAllowed = value; });

export const isDiagnosticsAllowed = (): boolean => diagnosticsAllowed;
export const setDiagnosticsAllowed = (value: boolean): void => { diagnosticsAllowed = value; };

// Gated wrappers — every call site should use these instead of calling Sentry
// directly, so the diagnostics preference is enforced in exactly one place.
export const reportException: typeof Sentry.captureException = (exception, hint) => {
  if (!diagnosticsAllowed) return '';
  return Sentry.captureException(exception, hint);
};

export const reportBreadcrumb: typeof Sentry.addBreadcrumb = (breadcrumb, hint) => {
  if (!diagnosticsAllowed) return;
  Sentry.addBreadcrumb(breadcrumb, hint);
};

export { Sentry };

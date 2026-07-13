import * as Sentry from '@sentry/react-native';
import { ENV } from '../services/config';

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

export { Sentry };

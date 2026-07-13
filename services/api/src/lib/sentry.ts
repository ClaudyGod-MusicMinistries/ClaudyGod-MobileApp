import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { createLogger } from './logger';

const log = createLogger('sentry');

// Mirrors the existing optional-telemetry pattern in lib/telemetry.ts — a no-op
// when SENTRY_DSN isn't set (local dev, CI, anywhere that hasn't been given a
// DSN) rather than a hard requirement.
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    log.info('Sentry disabled (SENTRY_DSN not set)');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.2,
  });

  log.info('Sentry initialized');
}

export { Sentry };

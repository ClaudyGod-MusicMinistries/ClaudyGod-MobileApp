import { env } from '../../config/env';
import { HttpError } from '../../lib/errors';
import { createLogger } from '../../lib/logger';

const log = createLogger('website.service');

// Mirrors the .NET backend's own response envelope (see CGM-Backend's
// ApiResponse<T>) so a failure surfaces the real backend message/errors
// instead of a generic proxy error — same contract the website's own
// Next.js -> CGM-Backend proxy (lib/data/backendProxy.ts) already relies on.
interface CgmEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
  fieldErrors?: Record<string, string[]>;
}

export interface CgmActor {
  id: string;
  email: string;
}

function ensureConfigured(): void {
  if (!env.CGM_ENABLED) {
    throw new HttpError(503, 'The website backend is not configured (CGM_API_BASE_URL/CGM_API_KEY unset)');
  }
}

// One shared request function every website.routes.ts handler calls through —
// attaches the shared server-to-server x-api-key (CGM-Backend's ApiKeyMiddleware
// is the real trust boundary now that its own JWT auth was removed) plus who's
// actually acting, forwarded as x-actor-id/x-actor-email so CGM-Backend's audit
// log still records a real admin instead of "anonymous" for every write.
export async function cgmRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: string,
  actor: CgmActor,
  options: { body?: unknown; query?: Record<string, string | undefined> } = {},
): Promise<T> {
  ensureConfigured();

  const url = new URL(`${env.CGM_API_BASE_URL}/api/v1.0${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-api-key': env.CGM_API_KEY,
      'x-actor-id': actor.id,
      'x-actor-email': actor.email,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) {
    const text = await response.text();
    log.error('Non-JSON response from CGM-Backend', { url: url.toString(), status: response.status, body: text.slice(0, 500) });
    throw new HttpError(502, 'The website backend returned an unexpected response');
  }

  const envelope = (await response.json()) as CgmEnvelope<T>;

  if (!response.ok || !envelope.success) {
    throw new HttpError(
      response.status >= 400 ? response.status : 502,
      envelope.message || 'The website backend rejected the request',
      { errors: envelope.errors, fieldErrors: envelope.fieldErrors },
    );
  }

  return envelope.data;
}

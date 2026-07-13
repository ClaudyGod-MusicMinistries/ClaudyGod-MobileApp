import { randomUUID } from 'crypto';
import type { RequestHandler } from 'express';
import { logger } from '../lib/logger';
import { httpRequestsTotal, httpRequestDuration } from '../lib/metrics';
import type { JwtClaims } from '../utils/jwt';

// Route label uses the matched Express route pattern (e.g. "/v1/content/manage/:id")
// once available, falling back to the raw path before routing has resolved it —
// keeps Prometheus cardinality bounded instead of one time series per content ID.
function routeLabel(req: Parameters<RequestHandler>[0]): string {
  const matched = req.route?.path as string | undefined;
  if (matched) {
    const base = req.baseUrl || '';
    return `${base}${matched}` || req.path;
  }
  return req.path;
}

export const requestTrackingMiddleware: RequestHandler = (req, res, next) => {
  // Generate or use provided request ID
  const requestId = req.header('x-request-id') || randomUUID();
  req.id = requestId;
  const startedAt = process.hrtime.bigint();

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request
  logger.info('Request received', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.header('user-agent'),
  });

  // Track response
  const originalSend = res.send;
  res.send = function (data) {
    logger.info('Response sent', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });

    const route = routeLabel(req);
    const statusCode = String(res.statusCode);
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, durationMs);

    return originalSend.call(this, data);
  };

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validated?: any;
      user?: JwtClaims;
    }
  }
}

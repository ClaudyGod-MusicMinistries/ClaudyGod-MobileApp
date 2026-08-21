import type { RequestHandler } from 'express';
import { recordSecurityEvent } from '../modules/auth/accountSecurity.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ADMIN_WORKFLOW_PREFIXES = [
  '/v1/admin',
  '/v1/content/manage',
  '/v1/content/requests',
  '/v1/live',
  '/v1/youtube',
  '/v1/website',
];

/**
 * Records privileged mutations after the response finishes. It deliberately
 * stores route metadata only—never request bodies, credentials, or uploaded
 * file contents. `req.user` is resolved by each protected route before finish.
 */
export const adminAuditMiddleware: RequestHandler = (req, res, next) => {
  const path = req.originalUrl.split('?')[0] ?? req.path;
  const shouldAudit = MUTATING_METHODS.has(req.method)
    && ADMIN_WORKFLOW_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (shouldAudit) {
    res.once('finish', () => {
      if (!req.user || req.user.role === 'CLIENT') return;
      void recordSecurityEvent(req.user.sub, 'admin_mutation', {
        ip: req.ip,
        userAgent: req.header('user-agent') ?? null,
        metadata: {
          method: req.method,
          path,
          statusCode: res.statusCode,
          requestId: req.id,
          role: req.user.role,
          outcome: res.statusCode < 400 ? 'success' : 'failure',
        },
      });
    });
  }

  next();
};

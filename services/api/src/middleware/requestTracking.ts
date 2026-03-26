import crypto from 'crypto';
import type { RequestHandler } from 'express';
import { logger } from '../lib/logger';

export const requestTrackingMiddleware: RequestHandler = (req, res, next) => {
  // Generate or use provided request ID
  const requestId = req.header('x-request-id') || crypto.randomUUID();
  req.id = requestId;

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
    return originalSend.call(this, data);
  };

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
      validated?: any;
      user?: {
        sub: string;
        email: string;
        role: string;
        displayName: string;
      };
    }
  }
}

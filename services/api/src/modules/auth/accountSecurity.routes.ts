import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { UnauthorizedError } from '../../lib/errors';
import { getSecuritySummary, revokeAllSessions } from './accountSecurity.service';

export const accountSecurityRouter = Router();

accountSecurityRouter.use(authenticate);

accountSecurityRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const summary = await getSecuritySummary(req.user.sub);
    res.status(200).json(summary);
  }),
);

accountSecurityRouter.post(
  '/sessions/revoke-all',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const count = await revokeAllSessions(req.user.sub);
    res.status(200).json({ message: `Revoked ${count} session(s)`, revokedCount: count });
  }),
);

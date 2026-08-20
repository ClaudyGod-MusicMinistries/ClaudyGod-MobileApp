import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors';
import { authenticate } from '../../middleware/authenticate';
import { requirePrivilegedMfa } from '../../middleware/requirePrivilegedMfa';
import { cgmRequest, type CgmActor } from './website.service';

// The website's presigned-S3 upload pipeline — a thin proxy only. All S3 calls
// (presign, HeadObject confirm) happen inside CGM-Backend's WebsiteS3StorageService;
// this router never talks to S3 directly, exactly like every other resource in
// website.routes.ts stays a pure requireAdmin() + cgmRequest() pass-through.
// Deliberately its own file/mount point (mirrors admin/storage.routes.ts's own
// top-level mount) rather than folded into website.routes.ts, since it's a
// distinct concern from the CRUD resources there.
export const websiteStorageRouter = Router();

websiteStorageRouter.use(authenticate);
websiteStorageRouter.use(requirePrivilegedMfa);

function requireAdmin(req: Request): CgmActor {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Admin access required', 'ADMIN_REQUIRED');
  }
  return { id: req.user.sub, email: req.user.email };
}

websiteStorageRouter.post(
  '/request-upload',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('POST', '/storage/request-upload', actor, { body: req.body }));
  }),
);

websiteStorageRouter.post(
  '/confirm',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('POST', '/storage/confirm', actor, { body: req.body }));
  }),
);

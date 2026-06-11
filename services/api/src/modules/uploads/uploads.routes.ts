import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { adminSignedUploadRequestSchema, uploadPoliciesResponse } from './uploads.schema';
import { requestSignedUploadUrl } from './uploads.service';

export const uploadsRouter = Router();

function requireAdmin(req: { user?: { role: string } }) {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Only admin accounts can issue admin upload URLs', 'ADMIN_REQUIRED');
  }
}

uploadsRouter.get(
  '/policies',
  authenticate,
  asyncHandler(async (req, res) => {
    requireAdmin(req);

    res.status(200).json(uploadPoliciesResponse);
  }),
);

uploadsRouter.post(
  '/signed-url',
  authenticate,
  asyncHandler(async (req, res) => {
    requireAdmin(req);

    const parsed = validateSchema(adminSignedUploadRequestSchema, req.body);
    const payload = {
      ...parsed,
      folder: parsed.folder ?? undefined,
    };

    const result = await requestSignedUploadUrl({
      ...payload,
      channel: 'admin',
      requestedByUserId: req.user!.sub,
    });

    res.status(201).json(result);
  }),
);

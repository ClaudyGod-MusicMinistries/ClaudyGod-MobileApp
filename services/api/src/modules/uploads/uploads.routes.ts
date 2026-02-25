import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { signedUploadRequestSchema } from './uploads.schema';
import { requestSignedUploadUrl } from './uploads.service';

export const uploadsRouter = Router();

uploadsRouter.post(
  '/signed-url',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }
    if (req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }

    const parsed = validateSchema(signedUploadRequestSchema, req.body);
    const payload = {
      ...parsed,
      folder: parsed.folder ?? 'mobile-content',
    };

    const result = await requestSignedUploadUrl({
      ...payload,
      channel: 'admin',
      requestedByUserId: req.user.sub,
    });

    res.status(201).json(result);
  }),
);

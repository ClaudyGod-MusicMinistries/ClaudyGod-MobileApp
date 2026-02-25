import { Router } from 'express';
import { validateSchema } from '../../lib/validation';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { signedUploadRequestSchema } from './uploads.schema';
import { requestSignedUploadUrl } from './uploads.service';

export const uploadsRouter = Router();

uploadsRouter.post(
  '/signed-url',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new Error('Unauthorized');
    }

    const payload = validateSchema(signedUploadRequestSchema, req.body);
    const result = await requestSignedUploadUrl({
      ...payload,
      channel: 'admin',
      requestedByUserId: req.user.sub,
    });

    res.status(201).json(result);
  }),
);

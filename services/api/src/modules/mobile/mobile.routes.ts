import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { requireMobileApiKey } from '../../middleware/requireMobileApiKey';
import { listContentQuerySchema } from '../content/content.schema';
import { listPublicContent } from '../content/content.service';
import { signedUploadRequestSchema } from '../uploads/uploads.schema';
import { requestSignedUploadUrl } from '../uploads/uploads.service';

export const mobileRouter = Router();

mobileRouter.get(
  '/content',
  asyncHandler(async (req, res) => {
    const query = validateSchema(listContentQuerySchema, req.query);
    const data = await listPublicContent(query);
    res.status(200).json(data);
  }),
);

mobileRouter.post(
  '/uploads/signed-url',
  requireMobileApiKey,
  asyncHandler(async (req, res) => {
    const payload = validateSchema(signedUploadRequestSchema, req.body);
    const result = await requestSignedUploadUrl({
      ...payload,
      channel: 'mobile',
    });

    res.status(201).json(result);
  }),
);

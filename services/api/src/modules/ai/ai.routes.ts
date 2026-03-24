import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { generateAdCopySchema } from './ai.schema';
import { generateAdCopySuggestion } from './ai.service';

export const adminAiRouter = Router();

adminAiRouter.use(authenticate);

adminAiRouter.post(
  '/ad-copy',
  asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }

    const input = validateSchema(generateAdCopySchema, req.body);
    const result = await generateAdCopySuggestion(req.user, input);
    res.status(200).json(result);
  }),
);

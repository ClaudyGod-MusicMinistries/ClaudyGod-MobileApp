import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError } from '../../lib/errors';
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
      throw new ForbiddenError('Admin role required', 'ADMIN_REQUIRED');
    }

    const input = validateSchema(generateAdCopySchema, req.body);
    const result = await generateAdCopySuggestion(req.user, input);
    res.status(200).json(result);
  }),
);

import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { requireCapability } from '../../middleware/rbac';
import { generateAdCopySchema } from './ai.schema';
import { generateAdCopySuggestion } from './ai.service';

export const adminAiRouter = Router();

adminAiRouter.use(authenticate);
adminAiRouter.use(requireCapability('ads.manage'));

adminAiRouter.post(
  '/ad-copy',
  asyncHandler(async (req, res) => {
    const input = validateSchema(generateAdCopySchema, req.body);
    const result = await generateAdCopySuggestion(req.user!, input);
    res.status(200).json(result);
  }),
);

import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import {
  contentIdParamsSchema,
  createContentSchema,
  listContentQuerySchema,
  updateVisibilitySchema,
} from './content.schema';
import {
  createContent,
  listManagedContent,
  listPublicContent,
  updateContentVisibility,
} from './content.service';

export const contentRouter = Router();

contentRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = validateSchema(listContentQuerySchema, req.query);
    const data = await listPublicContent(query);
    res.status(200).json(data);
  }),
);

contentRouter.get(
  '/manage',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const query = validateSchema(listContentQuerySchema, req.query);
    const data = await listManagedContent(req.user, query);
    res.status(200).json(data);
  }),
);

contentRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const payload = validateSchema(createContentSchema, req.body);
    const item = await createContent(req.user, payload);
    res.status(201).json(item);
  }),
);

contentRouter.patch(
  '/:id/visibility',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const params = validateSchema(contentIdParamsSchema, req.params);
    const payload = validateSchema(updateVisibilitySchema, req.body);
    const item = await updateContentVisibility({
      contentId: params.id,
      visibility: payload.visibility,
      requester: req.user,
    });
    res.status(200).json(item);
  }),
);

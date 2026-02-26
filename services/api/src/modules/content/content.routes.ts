import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import {
  assignContentSectionsSchema,
  contentIdParamsSchema,
  createContentSchema,
  listContentQuerySchema,
  updateContentSchema,
  updateVisibilitySchema,
} from './content.schema';
import {
  deleteContent,
  updateContent,
  updateContentSections,
  createContent,
  listManagedContent,
  listPublicContent,
  updateContentVisibility,
} from './content.service';

export const contentRouter = Router();

contentRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = validateSchema(listContentQuerySchema, req.query);
    const query = {
      page: parsed.page ?? 1,
      limit: parsed.limit ?? 20,
      type: parsed.type,
      status: parsed.status,
      visibility: parsed.visibility,
      search: parsed.search,
      updatedAfter: parsed.updatedAfter,
    };
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

    const parsed = validateSchema(listContentQuerySchema, req.query);
    const query = {
      page: parsed.page ?? 1,
      limit: parsed.limit ?? 20,
      type: parsed.type,
      status: parsed.status,
      visibility: parsed.visibility,
      search: parsed.search,
      updatedAfter: parsed.updatedAfter,
    };
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

    const parsed = validateSchema(createContentSchema, req.body);
    const payload = {
      ...parsed,
      visibility: parsed.visibility ?? 'draft',
    };
    const item = await createContent(req.user, payload);
    res.status(201).json(item);
  }),
);

contentRouter.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const params = validateSchema(contentIdParamsSchema, req.params);
    const payload = validateSchema(updateContentSchema, req.body);
    const item = await updateContent({
      contentId: params.id,
      input: payload,
      requester: req.user,
    });
    res.status(200).json(item);
  }),
);

contentRouter.patch(
  '/:id/sections',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const params = validateSchema(contentIdParamsSchema, req.params);
    const payload = validateSchema(assignContentSectionsSchema, req.body);
    const item = await updateContentSections({
      contentId: params.id,
      appSections: payload.appSections,
      requester: req.user,
    });
    res.status(200).json(item);
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
    const parsed = validateSchema(updateVisibilitySchema, req.body);
    const item = await updateContentVisibility({
      contentId: params.id,
      visibility: parsed.visibility,
      requester: req.user,
    });
    res.status(200).json(item);
  }),
);

contentRouter.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const params = validateSchema(contentIdParamsSchema, req.params);
    const result = await deleteContent({
      contentId: params.id,
      requester: req.user,
    });
    res.status(200).json(result);
  }),
);

import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors';
import { JwtClaims } from '../../utils/jwt';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import {
  assignContentSectionsSchema,
  contentIdParamsSchema,
  contentRequestIdParamsSchema,
  createContentSchema,
  createContentRequestSchema,
  listContentQuerySchema,
  updateContentRequestStatusSchema,
  updateContentSchema,
  updateVisibilitySchema,
} from './content.schema';
import {
  createContentRequest,
  deleteContent,
  createDraftFromContentRequest,
  updateContent,
  updateContentSections,
  createContent,
  listContentRequests,
  listManagedContent,
  listPublicContent,
  updateContentRequestStatus,
  updateContentVisibility,
} from './content.service';

export const contentRouter = Router();

function requireAdmin(user: unknown): JwtClaims {
  if (!user || typeof user !== 'object') {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  const candidate = user as JwtClaims;
  if (candidate.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required', 'ADMIN_REQUIRED');
  }
  if (!candidate.sub || !candidate.email || !candidate.displayName) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  return candidate;
}

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
      throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
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
    const data = await listManagedContent(req.user!, query);
    res.status(200).json(data);
  }),
);

contentRouter.get(
  '/requests',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req.user);

    const data = await listContentRequests(actor);
    res.status(200).json({ items: data });
  }),
);

contentRouter.post(
  '/requests',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    }

    const payload = validateSchema(createContentRequestSchema, req.body);
    const item = await createContentRequest(req.user!, payload);
    res.status(201).json(item);
  }),
);

contentRouter.patch(
  '/requests/:id/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req.user);

    const params = validateSchema(contentRequestIdParamsSchema, req.params);
    const payload = validateSchema(updateContentRequestStatusSchema, req.body);
    const item = await updateContentRequestStatus({
      requestId: params.id,
      status: payload.status,
      requester: actor,
    });
    res.status(200).json(item);
  }),
);

contentRouter.post(
  '/requests/:id/create-draft',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req.user);

    const params = validateSchema(contentRequestIdParamsSchema, req.params);
    const result = await createDraftFromContentRequest({
      requestId: params.id,
      requester: actor,
    });
    res.status(201).json(result);
  }),
);

contentRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req.user);

    const parsed = validateSchema(createContentSchema, req.body);
    const payload = {
      ...parsed,
      visibility: parsed.visibility ?? 'draft',
    };
    const item = await createContent(actor, payload);
    res.status(201).json(item);
  }),
);

contentRouter.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req.user);

    const params = validateSchema(contentIdParamsSchema, req.params);
    const payload = validateSchema(updateContentSchema, req.body);
    const item = await updateContent({
      contentId: params.id,
      input: payload,
      requester: actor,
    });
    res.status(200).json(item);
  }),
);

contentRouter.patch(
  '/:id/sections',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req.user);

    const params = validateSchema(contentIdParamsSchema, req.params);
    const payload = validateSchema(assignContentSectionsSchema, req.body);
    const item = await updateContentSections({
      contentId: params.id,
      appSections: payload.appSections,
      requester: actor,
    });
    res.status(200).json(item);
  }),
);

contentRouter.patch(
  '/:id/visibility',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req.user);

    const params = validateSchema(contentIdParamsSchema, req.params);
    const parsed = validateSchema(updateVisibilitySchema, req.body);
    const item = await updateContentVisibility({
      contentId: params.id,
      visibility: parsed.visibility,
      requester: actor,
    });
    res.status(200).json(item);
  }),
);

contentRouter.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req.user);

    const params = validateSchema(contentIdParamsSchema, req.params);
    const result = await deleteContent({
      contentId: params.id,
      requester: actor,
    });
    res.status(200).json(result);
  }),
);

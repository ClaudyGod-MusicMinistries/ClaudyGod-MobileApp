import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors';
import type { JwtClaims } from '../../utils/jwt';
import { hasMinRole } from '../../middleware/rbac';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { contentRequestLimiter } from '../../middleware/rateLimiter';
import {
  assignContentSectionsSchema,
  bulkUpdateVisibilitySchema,
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
  bulkUpdateContentVisibility,
  createContentRequest,
  deleteContent,
  createDraftFromContentRequest,
  getManagedContentById,
  updateContent,
  updateContentSections,
  createContent,
  listContentRequests,
  listManagedContent,
  listPublicContent,
  updateContentRequestStatus,
  updateContentVisibility,
} from './content.service';
import { pool } from '../../db/pool';
import { CacheService, CacheTTL } from '../../lib/cache';

export const contentRouter = Router();

function requireAdmin(user: unknown): JwtClaims {
  if (!user || typeof user !== 'object') {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  const candidate = user as JwtClaims;
  if (!candidate.sub || !candidate.email || !candidate.displayName) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  if (!hasMinRole(candidate.role, 'ADMIN')) {
    throw new ForbiddenError('Admin access required', 'ADMIN_REQUIRED');
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
      section: parsed.section,
      search: parsed.search,
      updatedAfter: parsed.updatedAfter,
      sort: parsed.sort,
      sortDir: parsed.sortDir,
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
      section: parsed.section,
      search: parsed.search,
      updatedAfter: parsed.updatedAfter,
      sort: parsed.sort,
      sortDir: parsed.sortDir,
    };
    const data = await listManagedContent(req.user!, query);
    res.status(200).json(data);
  }),
);

contentRouter.get(
  '/manage/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    }
    const params = validateSchema(contentIdParamsSchema, req.params);
    const item = await getManagedContentById(req.user, params.id);
    res.status(200).json(item);
  }),
);

contentRouter.patch(
  '/manage/bulk',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req.user);
    const payload = validateSchema(bulkUpdateVisibilitySchema, req.body);
    const result = await bulkUpdateContentVisibility({
      ids: payload.ids,
      visibility: payload.visibility,
      requester: actor,
    });
    res.status(200).json(result);
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
  contentRequestLimiter,
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
  '/manage',
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
  '/manage/:id',
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

contentRouter.get(
  '/trending',
  asyncHandler(async (req, res) => {
    const period = (req.query.period as string) || 'daily';
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    if (!['hourly', 'daily', 'weekly'].includes(period)) {
      res.status(400).json({ message: 'Invalid period. Use hourly, daily, or weekly.' });
      return;
    }

    const cacheKey = `trending:${period}:${limit}`;
    const cached = await CacheService.get<unknown[]>('feed', cacheKey);
    if (cached) {
      res.status(200).json({ items: cached, period });
      return;
    }

    const result = await pool.query(
      `SELECT DISTINCT ON (ts.content_id)
         ci.id, ci.title, ci.description, ci.content_type, ci.media_url,
         ci.thumbnail_url, ci.channel_name, ci.duration_label, ci.tags,
         ci.app_sections, ci.created_at, ci.updated_at,
         ts.score AS trending_score, ts.rank
       FROM trending_snapshots ts
       INNER JOIN content_items ci ON ci.id = ts.content_id
       WHERE ts.period = $1
         AND ci.visibility = 'published'
       ORDER BY ts.content_id, ts.calculated_at DESC, ts.score DESC
       LIMIT $2`,
      [period, limit],
    );

    const items = result.rows;
    await CacheService.set('feed', cacheKey, items, CacheTTL.TRENDING);
    res.status(200).json({ items, period });
  }),
);

contentRouter.delete(
  '/manage/:id',
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

import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { hasMinRole } from '../../middleware/rbac';
import {
  createLiveMessageSchema,
  createLiveSessionSchema,
  endLiveSessionSchema,
  listAdminLiveSessionsQuerySchema,
  listLiveSessionsQuerySchema,
  liveMessageIdParamsSchema,
  liveSessionIdParamsSchema,
  updateLiveMessageStatusSchema,
  updateLiveSessionSchema,
} from './live.schema';
import {
  createLiveSession,
  createLiveSessionMessage,
  deleteAdminLiveSession,
  endLiveSession,
  getAdminLiveSessionDetail,
  getPublicLiveSessionDetail,
  listAdminLiveSessions,
  listPublicLiveSessions,
  startLiveSession,
  updateLiveSession,
  updateLiveSessionMessageStatus,
} from './live.service';

export const liveRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  return req.user;
}

// Named requireAdmin for historical reasons, but the actual threshold matches
// the admin panel's own nav config (`minRole: Role.MODERATOR` for /live) —
// moderators are meant to manage live sessions, not just admins.
function requireAdmin(req: Request) {
  const user = requireUser(req);
  if (!hasMinRole(user.role, 'MODERATOR')) {
    throw new ForbiddenError('Moderator role or higher required', 'MODERATOR_REQUIRED');
  }
  return user;
}

liveRouter.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const query = validateSchema(listLiveSessionsQuerySchema, req.query);
    const result = await listPublicLiveSessions(query);
    res.status(200).json(result);
  }),
);

liveRouter.get(
  '/sessions/:id',
  asyncHandler(async (req, res) => {
    const params = validateSchema(liveSessionIdParamsSchema, req.params);
    const result = await getPublicLiveSessionDetail(params.id);
    res.status(200).json(result);
  }),
);

liveRouter.post(
  '/sessions/:id/messages',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireUser(req);
    const params = validateSchema(liveSessionIdParamsSchema, req.params);
    const payload = validateSchema(createLiveMessageSchema, req.body);
    const result = await createLiveSessionMessage(actor, params.id, payload);
    res.status(201).json(result);
  }),
);

liveRouter.get(
  '/manage',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const query = validateSchema(listAdminLiveSessionsQuerySchema, req.query);
    const result = await listAdminLiveSessions(actor, query);
    res.status(200).json(result);
  }),
);

liveRouter.get(
  '/manage/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const params = validateSchema(liveSessionIdParamsSchema, req.params);
    const result = await getAdminLiveSessionDetail(actor, params.id);
    res.status(200).json(result);
  }),
);

liveRouter.post(
  '/manage',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const payload = validateSchema(createLiveSessionSchema, req.body);
    const result = await createLiveSession(actor, payload);
    res.status(201).json(result);
  }),
);

liveRouter.patch(
  '/manage/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const params = validateSchema(liveSessionIdParamsSchema, req.params);
    const payload = validateSchema(updateLiveSessionSchema, req.body);
    const result = await updateLiveSession(actor, params.id, payload);
    res.status(200).json(result);
  }),
);

liveRouter.delete(
  '/manage/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const params = validateSchema(liveSessionIdParamsSchema, req.params);
    await deleteAdminLiveSession(actor, params.id);
    res.status(204).send();
  }),
);

liveRouter.post(
  '/manage/:id/start',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const params = validateSchema(liveSessionIdParamsSchema, req.params);
    const result = await startLiveSession(actor, params.id);
    res.status(200).json(result);
  }),
);

liveRouter.post(
  '/manage/:id/end',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const params = validateSchema(liveSessionIdParamsSchema, req.params);
    const payload = validateSchema(endLiveSessionSchema, req.body);
    const result = await endLiveSession(actor, params.id, payload);
    res.status(200).json(result);
  }),
);

liveRouter.patch(
  '/manage/:id/messages/:messageId',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const params = validateSchema(liveMessageIdParamsSchema, req.params);
    const payload = validateSchema(updateLiveMessageStatusSchema, req.body);
    const result = await updateLiveSessionMessageStatus(actor, params.id, params.messageId, payload.status);
    res.status(200).json(result);
  }),
);

import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import {
  createLiveMessageSchema,
  createLiveSessionSchema,
  endLiveSessionSchema,
  listLiveSessionsQuerySchema,
  liveSessionIdParamsSchema,
  updateLiveSessionSchema,
} from './live.schema';
import {
  createLiveSession,
  createLiveSessionMessage,
  endLiveSession,
  getAdminLiveSessionDetail,
  getPublicLiveSessionDetail,
  listAdminLiveSessions,
  listPublicLiveSessions,
  startLiveSession,
  updateLiveSession,
} from './live.service';

export const liveRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Unauthorized');
  }
  return req.user;
}

function requireAdmin(req: Request) {
  const user = requireUser(req);
  if (user.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin access required');
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
    const result = await listAdminLiveSessions(actor);
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

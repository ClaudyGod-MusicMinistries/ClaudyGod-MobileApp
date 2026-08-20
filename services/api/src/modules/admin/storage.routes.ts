import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { UnauthorizedError } from '../../lib/errors';
import { assertCapability } from '../../middleware/rbac';
import { authenticate } from '../../middleware/authenticate';
import { requirePrivilegedMfa } from '../../middleware/requirePrivilegedMfa';
import { validateSchema } from '../../lib/validation';
import {
  confirmStorageUploadSchema,
  requestStorageUploadSchema,
  sessionIdParamsSchema,
  storageSessionQuerySchema,
} from './storage.schema';
import {
  confirmAdminS3Upload,
  deleteAdminS3Upload,
  getPresignedDownloadUrl,
  getAdminStorageHealth,
  getAdminUploadSession,
  listAdminStorageSessions,
  requestAdminS3Upload,
} from './storage.service';

export const adminStorageRouter = Router();

adminStorageRouter.use(authenticate);
adminStorageRouter.use(requirePrivilegedMfa);

function requireAdminActor(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  assertCapability(req.user.role, 'storage.manage');
  return req.user;
}

adminStorageRouter.get(
  '/health',
  asyncHandler(async (req, res) => {
    requireAdminActor(req);
    const result = await getAdminStorageHealth();
    res.status(200).json(result);
  }),
);

/**
 * POST /v1/admin/storage/request-upload
 *
 * Step 1 of the upload pipeline. Returns a time-limited presigned S3 PUT URL.
 * The client must PUT the file binary directly to `presignedUrl` with the correct
 * Content-Type header. After the PUT succeeds (HTTP 200), call /confirm.
 */
adminStorageRouter.post(
  '/request-upload',
  asyncHandler(async (req, res) => {
    const actor = requireAdminActor(req);
    const payload = validateSchema(requestStorageUploadSchema, req.body);
    const result = await requestAdminS3Upload({
      ...payload,
      clientReference: payload.clientReference ?? undefined,
      requestedByUserId: actor.sub,
    });
    res.status(201).json(result);
  }),
);

/**
 * POST /v1/admin/storage/confirm
 *
 * Step 2 of the upload pipeline. Verifies the object exists in S3 (HeadObject),
 * marks the session as 'uploaded', and returns the permanent public URL.
 * Pass this publicUrl as `url` when creating a content record.
 */
adminStorageRouter.post(
  '/confirm',
  asyncHandler(async (req, res) => {
    const actor = requireAdminActor(req);
    const payload = validateSchema(confirmStorageUploadSchema, req.body);
    const result = await confirmAdminS3Upload({
      sessionId: payload.sessionId,
      requestedByUserId: actor.sub,
    });
    res.status(200).json(result);
  }),
);

/**
 * GET /v1/admin/storage/sessions
 *
 * Lists upload sessions. Admins see all sessions; others see only their own.
 */
adminStorageRouter.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const actor = requireAdminActor(req);
    const query = validateSchema(storageSessionQuerySchema, req.query);
    const result = await listAdminStorageSessions({
      requestedByUserId: actor.sub,
      isAdmin: true,
      limit: query.limit,
      offset: query.offset,
      status: query.status,
    });
    res.status(200).json(result);
  }),
);

/**
 * GET /v1/admin/storage/sessions/:sessionId/download-url
 *
 * Returns a short-lived presigned GET URL for a confirmed upload.
 * Useful for admin preview before content is published.
 */
adminStorageRouter.get(
  '/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const actor = requireAdminActor(req);
    const params = validateSchema(sessionIdParamsSchema, req.params);
    res.status(200).json(await getAdminUploadSession({ sessionId: params.sessionId, requestedByUserId: actor.sub }));
  }),
);

adminStorageRouter.get(
  '/sessions/:sessionId/download-url',
  asyncHandler(async (req, res) => {
    const actor = requireAdminActor(req);
    const params = validateSchema(sessionIdParamsSchema, req.params);
    const result = await getPresignedDownloadUrl({
      sessionId: params.sessionId,
      requestedByUserId: actor.sub,
    });
    res.status(200).json(result);
  }),
);

/**
 * DELETE /v1/admin/storage/sessions/:sessionId
 *
 * Deletes the S3 object and marks the session as 'failed'.
 * Use this to clean up failed or cancelled uploads.
 */
adminStorageRouter.delete(
  '/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const actor = requireAdminActor(req);
    const params = validateSchema(sessionIdParamsSchema, req.params);
    const result = await deleteAdminS3Upload({
      sessionId: params.sessionId,
      requestedByUserId: actor.sub,
    });
    res.status(200).json(result);
  }),
);

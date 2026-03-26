import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import {
  adminUserIdParamsSchema,
  sendAdminTestEmailSchema,
  supportRequestIdParamsSchema,
  updateAdminUserRoleSchema,
  updateSupportRequestStatusSchema,
} from './admin.schema';
import {
  getAdminEmailDiagnostics,
  getAdminDashboard,
  sendAdminTestEmail,
  updateAdminUserRole,
  updateAdminSupportRequestStatus,
} from './admin.service';

export const adminRouter = Router();

adminRouter.use(authenticate);

function requireAdmin(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Unauthorized');
  }
  if (req.user.role !== 'ADMIN') {
    throw new HttpError(403, 'Admin access required');
  }
  return req.user;
}

function requireAuthenticated(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Unauthorized');
  }
  return req.user;
}

adminRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const actor = requireAuthenticated(req);
    const result = await getAdminDashboard(actor);
    res.status(200).json(result);
  }),
);

adminRouter.get(
  '/email/diagnostics',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const result = await getAdminEmailDiagnostics();
    res.status(200).json(result);
  }),
);

adminRouter.post(
  '/email/test',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const payload = validateSchema(sendAdminTestEmailSchema, req.body);
    const result = await sendAdminTestEmail({
      recipient: payload.recipient,
      actor,
    });
    res.status(202).json(result);
  }),
);

adminRouter.patch(
  '/users/:id/role',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const params = validateSchema(adminUserIdParamsSchema, req.params);
    const payload = validateSchema(updateAdminUserRoleSchema, req.body);
    const result = await updateAdminUserRole({
      userId: params.id,
      role: payload.role,
      actor,
    });
    res.status(200).json(result);
  }),
);

adminRouter.patch(
  '/support-requests/:id/status',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const params = validateSchema(supportRequestIdParamsSchema, req.params);
    const payload = validateSchema(updateSupportRequestStatusSchema, req.body);
    const result = await updateAdminSupportRequestStatus({
      requestId: params.id,
      status: payload.status,
    });
    res.status(200).json(result);
  }),
);

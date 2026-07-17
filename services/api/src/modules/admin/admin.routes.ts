import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import {
  adminContentIdParamsSchema,
  adminUnassignedContentQuerySchema,
  adminUserIdParamsSchema,
  approveAccessRequestSchema,
  createInvitationSchema,
  invitationIdParamsSchema,
  listAdminSupportRequestsQuerySchema,
  listAdminUsersQuerySchema,
  sendAdminTestEmailSchema,
  supportRequestIdParamsSchema,
  updateAdminUserRoleSchema,
  updateSupportRequestStatusSchema,
} from './admin.schema';
import {
  getAdminContentSectionSuggestions,
  getAdminEmailDiagnostics,
  getAdminDashboard,
  listAdminSupportRequests,
  listAdminUnassignedContent,
  listAdminUsers,
  sendAdminTestEmail,
  updateAdminUserRole,
  updateAdminSupportRequestStatus,
} from './admin.service';
import {
  createAdminInviteToken,
  listAdminInvitations,
  revokeAdminInvitation,
  listAdminAccessRequests,
  approveAdminAccessRequest,
  rejectAdminAccessRequest,
} from '../auth/auth.service';
import { queueAdminInviteEmail } from '../../infra/transactionalEmails';
import { env } from '../../config/env';

export const adminRouter = Router();

adminRouter.use(authenticate);

function requireAdmin(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Admin access required', 'ADMIN_REQUIRED');
  }
  return req.user;
}

function requireAuthenticated(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  return req.user;
}

adminRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
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

adminRouter.get(
  '/content/unassigned',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const query = validateSchema(adminUnassignedContentQuerySchema, req.query);
    const result = await listAdminUnassignedContent({
      limit: query.limit,
      visibility: query.visibility,
    });
    res.status(200).json(result);
  }),
);

adminRouter.get(
  '/content/:id/section-suggestions',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const params = validateSchema(adminContentIdParamsSchema, req.params);
    const result = await getAdminContentSectionSuggestions(params.id);
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

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const query = validateSchema(listAdminUsersQuerySchema, req.query);
    const result = await listAdminUsers(query);
    res.status(200).json(result);
  }),
);

adminRouter.get(
  '/support-requests',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const query = validateSchema(listAdminSupportRequestsQuerySchema, req.query);
    const result = await listAdminSupportRequests(query);
    res.status(200).json(result);
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


// ── Admin Invitations ────────────────────────────────────────────────────────

adminRouter.post(
  '/invitations',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const payload = validateSchema(createInvitationSchema, req.body);
    const invite = await createAdminInviteToken({
      email: payload.email,
      role: payload.role,
      invitedBy: actor.sub,
    });
    await queueAdminInviteEmail({
      toEmail: payload.email,
      inviterName: actor.displayName || actor.email,
      role: payload.role,
      rawToken: invite.rawToken,
      expiresInHours: env.ADMIN_INVITE_TTL_HOURS,
    });
    res.status(201).json({
      id: invite.id,
      email: payload.email,
      role: payload.role,
      expiresAt: invite.expiresAt.toISOString(),
      message: `Invitation sent to ${payload.email}`,
    });
  }),
);

adminRouter.get(
  '/invitations',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const invitations = await listAdminInvitations();
    res.status(200).json({ invitations });
  }),
);

adminRouter.delete(
  '/invitations/:id',
  asyncHandler(async (req, res) => {
    requireAdmin(req);
    const params = validateSchema(invitationIdParamsSchema, req.params);
    await revokeAdminInvitation(params.id);
    res.status(200).json({ message: 'Invitation revoked' });
  }),
);

// ── Admin Access Requests ────────────────────────────────────────────────────

function requireSuperAdmin(req: Request) {
  const user = requireAuthenticated(req);
  if (user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Super Admin access required', 'SUPER_ADMIN_REQUIRED');
  }
  return user;
}

adminRouter.get(
  '/access-requests',
  asyncHandler(async (req, res) => {
    requireSuperAdmin(req);
    const requests = await listAdminAccessRequests();
    res.status(200).json({ requests });
  }),
);

adminRouter.post(
  '/access-requests/:id/approve',
  asyncHandler(async (req, res) => {
    const actor = requireSuperAdmin(req);
    const { id } = req.params as { id: string };
    const { role } = validateSchema(approveAccessRequestSchema, req.body ?? {});

    const invite = await approveAdminAccessRequest(id, {
      id: actor.sub,
      displayName: actor.displayName ?? actor.email,
      email: actor.email,
    }, role);

    await queueAdminInviteEmail({
      toEmail: invite.email,
      inviterName: actor.displayName || actor.email,
      role,
      rawToken: invite.rawToken,
      expiresInHours: env.ADMIN_INVITE_TTL_HOURS,
    }).catch(() => { /* best-effort — don't fail the HTTP response if email queuing fails */ });

    res.status(200).json({ message: 'Invitation sent', expiresAt: invite.expiresAt.toISOString() });
  }),
);

adminRouter.post(
  '/access-requests/:id/reject',
  asyncHandler(async (req, res) => {
    const actor = requireSuperAdmin(req);
    const { id } = req.params as { id: string };
    await rejectAdminAccessRequest(id, actor.sub);
    res.status(200).json({ message: 'Request dismissed' });
  }),
);

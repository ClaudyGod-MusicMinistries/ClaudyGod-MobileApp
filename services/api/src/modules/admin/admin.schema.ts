import { z } from 'zod';

export const supportRequestStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);
export const adminUserRoleSchema = z.enum(['CLIENT', 'ADMIN']);
export const invitableRoleSchema = z.enum(['CREATOR', 'MODERATOR', 'ADMIN']);

export const createInvitationSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Must be a valid email address'),
    role: invitableRoleSchema,
  })
  .strict();

export const invitationIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const supportRequestIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const adminUserIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const updateSupportRequestStatusSchema = z
  .object({
    status: supportRequestStatusSchema,
  })
  .strict();

export const sendAdminTestEmailSchema = z
  .object({
    recipient: z.string().trim().toLowerCase().email(),
  })
  .strict();

export const updateAdminUserRoleSchema = z
  .object({
    role: adminUserRoleSchema,
  })
  .strict();

export const adminUnassignedContentQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    visibility: z.enum(['draft', 'published']).optional(),
  })
  .strict();

export const adminContentIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

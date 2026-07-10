import { z } from 'zod';

export const supportRequestStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);
export const adminUserRoleSchema = z.enum(['CLIENT', 'CREATOR', 'MODERATOR', 'ADMIN']);
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

const optionalTrimmedSearchSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().max(160).optional(),
) as unknown as z.ZodType<string | undefined>;

export const listAdminUsersQuerySchema = z
  .object({
    search: optionalTrimmedSearchSchema,
    role: z.enum(['CLIENT', 'CREATOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const listAdminSupportRequestsQuerySchema = z
  .object({
    status: supportRequestStatusSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const adminContentIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

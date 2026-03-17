import { z } from 'zod';

export const supportRequestStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);

export const supportRequestIdParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const updateSupportRequestStatusSchema = z
  .object({
    status: supportRequestStatusSchema,
  })
  .strict();

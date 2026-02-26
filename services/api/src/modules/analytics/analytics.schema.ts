import { z } from 'zod';

export const mostPlayedQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(12),
    windowDays: z.coerce.number().int().min(1).max(365).default(90),
  })
  .strict();

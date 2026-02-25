import { z } from 'zod';

export const signedUploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(3).max(255),
  folder: z.string().trim().min(1).max(80).default('mobile-content'),
  clientReference: z.string().trim().max(120).optional(),
});

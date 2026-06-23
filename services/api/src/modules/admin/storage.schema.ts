import { z } from 'zod';
import { uploadAssetKindSchema } from '../uploads/uploads.schema';

const safeFileNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine((v) => !v.includes('/') && !v.includes('\\'), 'fileName must not contain path separators')
  .refine((v) => v !== '.' && v !== '..', 'Invalid fileName')
  .refine((v) => !/^\.+$/.test(v), 'Invalid fileName');

const mimeTypeSchema = z
  .string()
  .trim()
  .min(3)
  .max(255)
  .regex(/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i, 'Invalid mimeType format')
  .refine(
    (v) => /^(image|video|audio)\//i.test(v),
    'mimeType must be image, video, or audio',
  );

export const requestStorageUploadSchema = z
  .object({
    fileName: safeFileNameSchema,
    mimeType: mimeTypeSchema,
    fileSizeBytes: z.coerce
      .number()
      .int()
      .min(1, 'fileSizeBytes must be greater than 0')
      .max(512 * 1024 * 1024, 'File exceeds maximum supported size of 512 MB'),
    assetKind: uploadAssetKindSchema,
    clientReference: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-zA-Z0-9._:@-]+$/, 'clientReference contains unsupported characters')
      .optional(),
  })
  .strict();

export const confirmStorageUploadSchema = z
  .object({
    sessionId: z.string().uuid(),
  })
  .strict();

export const sessionIdParamsSchema = z
  .object({
    sessionId: z.string().uuid(),
  })
  .strict();

export const storageSessionQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    status: z.enum(['issued', 'uploaded', 'expired', 'failed']).optional(),
  })
  .strict();

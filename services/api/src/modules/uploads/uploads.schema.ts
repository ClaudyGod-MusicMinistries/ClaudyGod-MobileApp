import { z } from 'zod';

const safeFileNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine((value) => !value.includes('/') && !value.includes('\\'), 'fileName must not contain path separators')
  .refine((value) => value !== '.' && value !== '..', 'Invalid fileName')
  .refine((value) => !/^\.+$/.test(value), 'Invalid fileName');

const mimeTypeSchema = z
  .string()
  .trim()
  .min(3)
  .max(255)
  .regex(/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i, 'Invalid mimeType format')
  .refine(
    (value) =>
      /^(image|video|audio)\//i.test(value) ||
      /^application\/(pdf|zip|x-zip-compressed|octet-stream|json)$/i.test(value) ||
      /^text\/plain$/i.test(value),
    'mimeType is not allowed',
  );

const folderSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9/_-]+$/, 'folder can only contain letters, numbers, slash, underscore, and dash')
  .refine((value) => !value.startsWith('/') && !value.endsWith('/'), 'folder must not start or end with "/"')
  .refine((value) => !value.includes('..'), 'folder must not contain ".."')
  .default('mobile-content');

const clientReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._:@-]+$/, 'clientReference contains unsupported characters')
  .optional();

export const signedUploadRequestSchema = z
  .object({
    fileName: safeFileNameSchema,
    mimeType: mimeTypeSchema,
    folder: folderSchema,
    clientReference: clientReferenceSchema,
  })
  .strict();

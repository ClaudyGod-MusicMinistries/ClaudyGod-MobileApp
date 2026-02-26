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
  .refine((value) => !value.includes('..'), 'folder must not contain ".."');

const clientReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._:@-]+$/, 'clientReference contains unsupported characters')
  .optional();

const fileSizeBytesSchema = z.coerce
  .number()
  .int()
  .min(1, 'fileSizeBytes must be greater than 0')
  .max(1024 * 1024 * 1024, 'fileSizeBytes is too large')
  .optional();

export const uploadAssetKindSchema = z.enum(['thumbnail', 'audio', 'video']);

type UploadAssetKind = z.infer<typeof uploadAssetKindSchema>;

interface UploadAssetPolicy {
  kind: UploadAssetKind;
  label: string;
  maxBytes: number;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  recommendedFolder: string;
}

export const uploadPolicies: Record<UploadAssetKind, UploadAssetPolicy> = {
  thumbnail: {
    kind: 'thumbnail',
    label: 'Thumbnail Image',
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    recommendedFolder: 'admin-thumbnails',
  },
  audio: {
    kind: 'audio',
    label: 'Audio File',
    maxBytes: 150 * 1024 * 1024,
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/x-m4a',
      'audio/aac',
      'audio/wav',
      'audio/x-wav',
      'audio/flac',
      'audio/x-flac',
      'audio/ogg',
      'audio/webm',
    ],
    allowedExtensions: ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.webm'],
    recommendedFolder: 'admin-audio',
  },
  video: {
    kind: 'video',
    label: 'Video File',
    maxBytes: 500 * 1024 * 1024,
    allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'],
    allowedExtensions: ['.mp4', '.mov', '.webm', '.mkv'],
    recommendedFolder: 'admin-video',
  },
};

export const uploadPoliciesResponse = {
  version: '2026-02-26',
  assets: Object.values(uploadPolicies).map((policy) => ({
    kind: policy.kind,
    label: policy.label,
    maxBytes: policy.maxBytes,
    maxMegabytes: Number((policy.maxBytes / (1024 * 1024)).toFixed(2)),
    allowedMimeTypes: [...policy.allowedMimeTypes],
    allowedExtensions: [...policy.allowedExtensions],
    recommendedFolder: policy.recommendedFolder,
  })),
} as const;

export const signedUploadRequestSchema = z
  .object({
    fileName: safeFileNameSchema,
    mimeType: mimeTypeSchema,
    fileSizeBytes: fileSizeBytesSchema,
    assetKind: uploadAssetKindSchema.optional(),
    folder: folderSchema.optional(),
    clientReference: clientReferenceSchema,
  })
  .strict();

export const adminSignedUploadRequestSchema = signedUploadRequestSchema
  .extend({
    fileSizeBytes: z.coerce
      .number()
      .int()
      .min(1, 'fileSizeBytes must be greater than 0')
      .max(1024 * 1024 * 1024, 'fileSizeBytes is too large'),
    assetKind: uploadAssetKindSchema,
  })
  .strict();

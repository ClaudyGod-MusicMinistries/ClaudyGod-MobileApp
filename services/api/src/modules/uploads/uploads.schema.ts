import { z } from 'zod';

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

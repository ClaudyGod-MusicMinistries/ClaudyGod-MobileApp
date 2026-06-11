import { z } from 'zod';

export const registerDeviceSchema = z.object({
  deviceFingerprint: z.string().trim().min(8).max(256),
  deviceName: z.string().trim().max(120).optional(),
  deviceType: z.enum(['mobile', 'tablet', 'tv', 'web', 'desktop']).default('mobile'),
  platform: z.string().trim().max(40).optional(),
  appVersion: z.string().trim().max(40).optional(),
  pushToken: z.string().trim().max(512).optional(),
});

export const revokeDeviceSchema = z.object({
  deviceId: z.string().uuid(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

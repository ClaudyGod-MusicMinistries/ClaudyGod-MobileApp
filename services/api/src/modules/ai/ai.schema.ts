import { z } from 'zod';

export const generateAdCopySchema = z.object({
  sponsorName: z.string().trim().min(2).max(120),
  placement: z.enum(['landing', 'home', 'videos', 'player', 'live', 'library', 'search']),
  objective: z.string().trim().min(6).max(400),
  audience: z.string().trim().max(300).optional(),
  landingUrl: z.string().trim().url().optional(),
  tone: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});

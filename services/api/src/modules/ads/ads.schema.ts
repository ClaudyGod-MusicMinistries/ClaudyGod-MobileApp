import { z } from 'zod';

const urlSchema = z.string().trim().url().refine((value) => /^https?:\/\//i.test(value), {
  message: 'CTA URL must be a valid http:// or https:// URL',
});

const adCampaignStatusSchema = z.enum(['draft', 'active', 'paused', 'archived']);
const adPlacementSchema = z.enum(['landing', 'home', 'videos', 'player', 'live', 'library', 'search']);

const baseAdCampaignSchema = z.object({
  name: z.string().trim().min(2).max(120),
  placement: adPlacementSchema,
  status: adCampaignStatusSchema.default('draft'),
  sponsorName: z.string().trim().min(2).max(120),
  headline: z.string().trim().min(4).max(180),
  body: z.string().trim().min(12).max(1000),
  ctaLabel: z.string().trim().min(2).max(40),
  ctaUrl: urlSchema,
  imageUrl: z.string().trim().url().optional(),
  audienceTags: z.array(z.string().trim().min(1).max(48)).max(20).optional(),
  dailyBudgetCents: z.coerce.number().int().min(0).max(10_000_000).default(0),
  weight: z.coerce.number().int().min(1).max(1000).default(100),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createAdCampaignSchema = baseAdCampaignSchema;
export const updateAdCampaignSchema = baseAdCampaignSchema.partial();
export const listAdCampaignsQuerySchema = z.object({
  status: adCampaignStatusSchema.optional(),
  placement: adPlacementSchema.optional(),
});

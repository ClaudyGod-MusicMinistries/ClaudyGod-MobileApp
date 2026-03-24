import type { AdPlacementScreen } from '../appConfig/appConfig.schema';

export type AdCampaignStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface AdCampaign {
  id: string;
  name: string;
  placement: AdPlacementScreen;
  status: AdCampaignStatus;
  sponsorName: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl?: string;
  audienceTags: string[];
  dailyBudgetCents: number;
  weight: number;
  startsAt?: string;
  endsAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdCampaignInput {
  name: string;
  placement: AdPlacementScreen;
  status: AdCampaignStatus;
  sponsorName: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl?: string;
  audienceTags?: string[];
  dailyBudgetCents?: number;
  weight?: number;
  startsAt?: string;
  endsAt?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAdCampaignInput extends Partial<CreateAdCampaignInput> {}

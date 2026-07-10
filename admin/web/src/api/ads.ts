import client from './client';
import type { AdCampaign, AdCampaignInput, AiAdCopyResponse, PaginatedResponse } from './types';
import type { AdCampaignPlacement } from '@/utils/constants';

export async function listCampaigns(params?: { status?: string; placement?: string }): Promise<PaginatedResponse<AdCampaign>> {
  const { data } = await client.get<PaginatedResponse<AdCampaign>>('/v1/admin/ads', { params });
  return data;
}

export async function createCampaign(input: AdCampaignInput): Promise<AdCampaign> {
  const { data } = await client.post<AdCampaign>('/v1/admin/ads', input);
  return data;
}

export async function updateCampaign(id: string, input: Partial<AdCampaignInput>): Promise<AdCampaign> {
  const { data } = await client.patch<AdCampaign>(`/v1/admin/ads/${id}`, input);
  return data;
}

export interface AdCopyRequest {
  sponsorName: string;
  placement: AdCampaignPlacement;
  objective: string;
}

export async function generateAdCopy(input: AdCopyRequest): Promise<AiAdCopyResponse> {
  const { data } = await client.post<AiAdCopyResponse>('/v1/admin/ai/ad-copy', input);
  return data;
}

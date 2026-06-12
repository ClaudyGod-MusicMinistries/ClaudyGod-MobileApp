import client from './client';
import type { AdCampaign, AdCampaignInput, AiAdCopyResponse, PaginatedResponse } from './types';

export async function listCampaigns(params?: { status?: string; page?: number }): Promise<PaginatedResponse<AdCampaign>> {
  const { data } = await client.get<PaginatedResponse<AdCampaign>>('/v1/admin/ads', { params });
  return data;
}

export async function getCampaign(id: string): Promise<AdCampaign> {
  const { data } = await client.get<AdCampaign>(`/v1/admin/ads/${id}`);
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

export async function generateAdCopy(prompt: string): Promise<AiAdCopyResponse> {
  const { data } = await client.post<AiAdCopyResponse>('/v1/admin/ai/ad-copy', { prompt });
  return data;
}

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listCampaigns, createCampaign, updateCampaign, generateAdCopy } from '@/api/ads';
import type { AdCopyRequest } from '@/api/ads';
import type { AdCampaign, AdCampaignInput, AiAdCopyResponse } from '@/api/types';

export const useAdsStore = defineStore('ads', () => {
  const campaigns = ref<AdCampaign[]>([]);
  const total = ref(0);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const isGenerating = ref(false);
  const error = ref<string | null>(null);

  async function fetchCampaigns(status?: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await listCampaigns({ status });
      campaigns.value = res.items;
      total.value = res.total;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load campaigns';
    } finally {
      isLoading.value = false;
    }
  }

  async function create(input: AdCampaignInput): Promise<AdCampaign> {
    isSaving.value = true;
    try {
      const campaign = await createCampaign(input);
      campaigns.value.unshift(campaign);
      total.value++;
      return campaign;
    } finally {
      isSaving.value = false;
    }
  }

  async function update(id: string, input: Partial<AdCampaignInput>): Promise<void> {
    const updated = await updateCampaign(id, input);
    campaigns.value = campaigns.value.map((c) => (c.id === id ? updated : c));
  }

  async function generateCopy(input: AdCopyRequest): Promise<AiAdCopyResponse> {
    isGenerating.value = true;
    try {
      return await generateAdCopy(input);
    } finally {
      isGenerating.value = false;
    }
  }

  return { campaigns, total, isLoading, isSaving, isGenerating, error, fetchCampaigns, create, update, generateCopy };
});

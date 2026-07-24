import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getWebsiteDashboard } from '@/api/website';
import type { WebsiteDashboardStats } from '@/api/websiteTypes';

export const useWebDashboardStore = defineStore('webDashboard', () => {
  const data = ref<WebsiteDashboardStats | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchedAt = ref<Date | null>(null);

  async function fetchDashboard(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      data.value = await getWebsiteDashboard();
      lastFetchedAt.value = new Date();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard';
    } finally {
      isLoading.value = false;
    }
  }

  return { data, isLoading, error, lastFetchedAt, fetchDashboard };
});

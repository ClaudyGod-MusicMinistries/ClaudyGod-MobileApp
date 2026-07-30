import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getWebsiteDashboard } from '@/api/website';
import type { WebsiteDashboardStats } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

export const useWebDashboardStore = defineStore('webDashboard', () => {
  const data = ref<WebsiteDashboardStats | null>(null);
  const { isLoading, error, execute } = useLatestRequest();
  const lastFetchedAt = ref<Date | null>(null);

  async function fetchDashboard(): Promise<void> {
    await execute(getWebsiteDashboard, (result) => {
      data.value = result;
      lastFetchedAt.value = new Date();
    });
  }

  return { data, isLoading, error, lastFetchedAt, fetchDashboard };
});

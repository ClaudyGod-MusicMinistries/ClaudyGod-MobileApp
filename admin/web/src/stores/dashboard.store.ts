import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getDashboard } from '@/api/analytics';
import type { DashboardData } from '@/api/types';

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardData | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchedAt = ref<Date | null>(null);

  async function fetchDashboard(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      data.value = await getDashboard();
      lastFetchedAt.value = new Date();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard';
    } finally {
      isLoading.value = false;
    }
  }

  return { data, isLoading, error, lastFetchedAt, fetchDashboard };
});

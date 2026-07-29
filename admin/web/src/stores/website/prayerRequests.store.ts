import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listPrayerRequests, deletePrayerRequest } from '@/api/website';
import type { PrayerRequestItem } from '@/api/websiteTypes';

const PAGE_SIZE = 20;

export const usePrayerRequestsStore = defineStore('websitePrayerRequests', () => {
  const items = ref<PrayerRequestItem[]>([]);
  const total = ref(0);
  const page = ref(1);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPrayerRequests(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await listPrayerRequests({ page: page.value, pageSize: PAGE_SIZE });
      items.value = result.items;
      total.value = result.totalCount;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load prayer requests';
    } finally {
      isLoading.value = false;
    }
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchPrayerRequests();
  }

  async function removePrayerRequest(id: string): Promise<void> {
    await deletePrayerRequest(id);
    await fetchPrayerRequests();
  }

  return { items, total, page, isLoading, error, pageSize: PAGE_SIZE, fetchPrayerRequests, setPage, removePrayerRequest };
});

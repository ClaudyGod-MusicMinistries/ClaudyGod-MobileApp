import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listPrayerRequests, deletePrayerRequest } from '@/api/website';
import type { PrayerRequestItem } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const usePrayerRequestsStore = defineStore('websitePrayerRequests', () => {
  const items = ref<PrayerRequestItem[]>([]);
  const total = ref(0);
  const page = ref(1);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchPrayerRequests(): Promise<void> {
    await execute(
      () => listPrayerRequests({ page: page.value, pageSize: PAGE_SIZE }),
      (result) => { items.value = result.items; total.value = result.totalCount; },
    );
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

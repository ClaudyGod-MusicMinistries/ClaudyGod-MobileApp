import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listSubscribers, deleteSubscriber } from '@/api/website';
import type { Subscriber } from '@/api/websiteTypes';

const PAGE_SIZE = 20;

export const useSubscribersStore = defineStore('websiteSubscribers', () => {
  const items = ref<Subscriber[]>([]);
  const total = ref(0);
  const page = ref(1);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSubscribers(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await listSubscribers({ page: page.value, pageSize: PAGE_SIZE });
      items.value = result.items;
      total.value = result.totalCount;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load subscribers';
    } finally {
      isLoading.value = false;
    }
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchSubscribers();
  }

  async function removeSubscriber(id: string): Promise<void> {
    await deleteSubscriber(id);
    await fetchSubscribers();
  }

  return { items, total, page, isLoading, error, pageSize: PAGE_SIZE, fetchSubscribers, setPage, removeSubscriber };
});

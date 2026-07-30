import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listSubscribers, deleteSubscriber } from '@/api/website';
import type { Subscriber } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const useSubscribersStore = defineStore('websiteSubscribers', () => {
  const items = ref<Subscriber[]>([]);
  const total = ref(0);
  const page = ref(1);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchSubscribers(): Promise<void> {
    await execute(
      () => listSubscribers({ page: page.value, pageSize: PAGE_SIZE }),
      (result) => { items.value = result.items; total.value = result.totalCount; },
    );
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

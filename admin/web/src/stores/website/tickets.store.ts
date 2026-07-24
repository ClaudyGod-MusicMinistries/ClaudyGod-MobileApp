import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listTickets } from '@/api/website';
import type { Ticket } from '@/api/websiteTypes';

const PAGE_SIZE = 20;

export const useTicketsStore = defineStore('websiteTickets', () => {
  const items = ref<Ticket[]>([]);
  const total = ref(0);
  const page = ref(1);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchTickets(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await listTickets({ page: page.value, pageSize: PAGE_SIZE });
      items.value = result.items;
      total.value = result.totalCount;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load tickets';
    } finally {
      isLoading.value = false;
    }
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchTickets();
  }

  return { items, total, page, isLoading, error, pageSize: PAGE_SIZE, fetchTickets, setPage };
});

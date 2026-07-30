import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listTickets, deleteTicket } from '@/api/website';
import type { Ticket } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const useTicketsStore = defineStore('websiteTickets', () => {
  const items = ref<Ticket[]>([]);
  const total = ref(0);
  const page = ref(1);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchTickets(): Promise<void> {
    await execute(
      () => listTickets({ page: page.value, pageSize: PAGE_SIZE }),
      (result) => { items.value = result.items; total.value = result.totalCount; },
    );
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchTickets();
  }

  async function removeTicket(id: string): Promise<void> {
    await deleteTicket(id);
    await fetchTickets();
  }

  return { items, total, page, isLoading, error, pageSize: PAGE_SIZE, fetchTickets, setPage, removeTicket };
});

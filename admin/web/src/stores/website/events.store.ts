import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listEvents, getEvent, createEvent, updateEvent, updateEventStatus } from '@/api/website';
import type { EventSummary, EventDetail, EventInput } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const useEventsStore = defineStore('websiteEvents', () => {
  const items = ref<EventSummary[]>([]);
  const total = ref(0);
  const page = ref(1);
  const statusFilter = ref<string | undefined>(undefined);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchEvents(): Promise<void> {
    await execute(
      () => listEvents({ page: page.value, pageSize: PAGE_SIZE, status: statusFilter.value }),
      (result) => { items.value = result.items; total.value = result.totalCount; },
    );
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchEvents();
  }

  function setStatusFilter(status: string | undefined): void {
    statusFilter.value = status;
    page.value = 1;
    void fetchEvents();
  }

  async function fetchEventDetail(id: string): Promise<EventDetail> {
    return getEvent(id);
  }

  async function saveEvent(input: EventInput, id?: string): Promise<void> {
    if (id) {
      await updateEvent(id, input);
    } else {
      await createEvent(input);
    }
    await fetchEvents();
  }

  async function changeStatus(id: string, status: string): Promise<void> {
    await updateEventStatus(id, status);
    await fetchEvents();
  }

  return {
    items,
    total,
    page,
    statusFilter,
    isLoading,
    error,
    pageSize: PAGE_SIZE,
    fetchEvents,
    setPage,
    setStatusFilter,
    fetchEventDetail,
    saveEvent,
    changeStatus,
  };
});

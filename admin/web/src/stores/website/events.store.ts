import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listEvents, getEvent, createEvent, updateEvent, updateEventStatus } from '@/api/website';
import type { EventSummary, EventDetail, EventInput } from '@/api/websiteTypes';

const PAGE_SIZE = 20;

export const useEventsStore = defineStore('websiteEvents', () => {
  const items = ref<EventSummary[]>([]);
  const total = ref(0);
  const page = ref(1);
  const statusFilter = ref<string | undefined>(undefined);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchEvents(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await listEvents({ page: page.value, pageSize: PAGE_SIZE, status: statusFilter.value });
      items.value = result.items;
      total.value = result.totalCount;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load events';
    } finally {
      isLoading.value = false;
    }
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

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listBookings, updateBookingStatus, deleteBooking } from '@/api/website';
import type { Booking } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const useBookingsStore = defineStore('websiteBookings', () => {
  const items = ref<Booking[]>([]);
  const total = ref(0);
  const page = ref(1);
  const statusFilter = ref<string | undefined>(undefined);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchBookings(): Promise<void> {
    await execute(
      () => listBookings({ page: page.value, pageSize: PAGE_SIZE, status: statusFilter.value }),
      (result) => { items.value = result.items; total.value = result.totalCount; },
    );
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchBookings();
  }

  function setStatusFilter(status: string | undefined): void {
    statusFilter.value = status;
    page.value = 1;
    void fetchBookings();
  }

  async function changeStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    await updateBookingStatus(id, status, adminNotes);
    await fetchBookings();
  }

  async function removeBooking(id: string): Promise<void> {
    await deleteBooking(id);
    await fetchBookings();
  }

  return { items, total, page, statusFilter, isLoading, error, pageSize: PAGE_SIZE, fetchBookings, setPage, setStatusFilter, changeStatus, removeBooking };
});

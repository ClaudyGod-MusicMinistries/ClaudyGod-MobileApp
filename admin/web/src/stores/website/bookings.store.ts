import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listBookings, updateBookingStatus, deleteBooking } from '@/api/website';
import type { Booking } from '@/api/websiteTypes';

const PAGE_SIZE = 20;

export const useBookingsStore = defineStore('websiteBookings', () => {
  const items = ref<Booking[]>([]);
  const total = ref(0);
  const page = ref(1);
  const statusFilter = ref<string | undefined>(undefined);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchBookings(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await listBookings({ page: page.value, pageSize: PAGE_SIZE, status: statusFilter.value });
      items.value = result.items;
      total.value = result.totalCount;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load bookings';
    } finally {
      isLoading.value = false;
    }
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

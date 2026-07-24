import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listVolunteers, deleteVolunteer } from '@/api/website';
import type { Volunteer } from '@/api/websiteTypes';

const PAGE_SIZE = 20;

export const useVolunteersStore = defineStore('websiteVolunteers', () => {
  const items = ref<Volunteer[]>([]);
  const total = ref(0);
  const page = ref(1);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchVolunteers(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await listVolunteers({ page: page.value, pageSize: PAGE_SIZE });
      items.value = result.items;
      total.value = result.totalCount;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load volunteers';
    } finally {
      isLoading.value = false;
    }
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchVolunteers();
  }

  async function removeVolunteer(id: string): Promise<void> {
    await deleteVolunteer(id);
    await fetchVolunteers();
  }

  return { items, total, page, isLoading, error, pageSize: PAGE_SIZE, fetchVolunteers, setPage, removeVolunteer };
});

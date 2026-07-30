import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listVolunteers, deleteVolunteer } from '@/api/website';
import type { Volunteer } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const useVolunteersStore = defineStore('websiteVolunteers', () => {
  const items = ref<Volunteer[]>([]);
  const total = ref(0);
  const page = ref(1);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchVolunteers(): Promise<void> {
    await execute(
      () => listVolunteers({ page: page.value, pageSize: PAGE_SIZE }),
      (result) => { items.value = result.items; total.value = result.totalCount; },
    );
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

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listTrash, restoreTrashItem, permanentlyDeleteTrashItem, emptyTrash } from '@/api/website';
import type { TrashItem, TrashEntityType } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const useTrashStore = defineStore('websiteTrash', () => {
  const items = ref<TrashItem[]>([]);
  const total = ref(0);
  const page = ref(1);
  const entityTypeFilter = ref<TrashEntityType | undefined>(undefined);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchTrash(): Promise<void> {
    await execute(
      () => listTrash({ page: page.value, pageSize: PAGE_SIZE, entityType: entityTypeFilter.value }),
      (result) => { items.value = result.items; total.value = result.totalCount; },
    );
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchTrash();
  }

  function setEntityTypeFilter(entityType: TrashEntityType | undefined): void {
    entityTypeFilter.value = entityType;
    page.value = 1;
    void fetchTrash();
  }

  async function restore(entityType: TrashEntityType, id: string): Promise<void> {
    await restoreTrashItem(entityType, id);
    await fetchTrash();
  }

  async function removeForever(entityType: TrashEntityType, id: string): Promise<void> {
    await permanentlyDeleteTrashItem(entityType, id);
    await fetchTrash();
  }

  async function empty(): Promise<void> {
    await emptyTrash();
    await fetchTrash();
  }

  return {
    items,
    total,
    page,
    entityTypeFilter,
    isLoading,
    error,
    pageSize: PAGE_SIZE,
    fetchTrash,
    setPage,
    setEntityTypeFilter,
    restore,
    removeForever,
    empty,
  };
});

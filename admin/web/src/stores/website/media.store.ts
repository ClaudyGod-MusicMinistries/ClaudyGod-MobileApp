import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listMedia, createMediaLink, updateMediaLink, deleteMedia } from '@/api/website';
import type { MediaItem, MediaLinkInput } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const useMediaStore = defineStore('websiteMedia', () => {
  const items = ref<MediaItem[]>([]);
  const total = ref(0);
  const page = ref(1);
  const typeFilter = ref<string | undefined>(undefined);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchMedia(): Promise<void> {
    await execute(
      () => listMedia({ page: page.value, pageSize: PAGE_SIZE, type: typeFilter.value }),
      (result) => { items.value = result.items; total.value = result.totalCount; },
    );
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchMedia();
  }

  function setTypeFilter(type: string | undefined): void {
    typeFilter.value = type;
    page.value = 1;
    void fetchMedia();
  }

  async function saveMediaLink(input: MediaLinkInput, id?: string): Promise<void> {
    if (id) {
      await updateMediaLink(id, input);
    } else {
      await createMediaLink(input);
    }
    await fetchMedia();
  }

  async function removeMedia(id: string): Promise<void> {
    await deleteMedia(id);
    await fetchMedia();
  }

  return {
    items,
    total,
    page,
    typeFilter,
    isLoading,
    error,
    pageSize: PAGE_SIZE,
    fetchMedia,
    setPage,
    setTypeFilter,
    saveMediaLink,
    removeMedia,
  };
});

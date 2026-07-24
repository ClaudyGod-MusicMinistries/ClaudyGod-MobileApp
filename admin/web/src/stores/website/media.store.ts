import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listMedia, createMediaLink, updateMediaLink, deleteMedia } from '@/api/website';
import type { MediaItem, MediaLinkInput } from '@/api/websiteTypes';

const PAGE_SIZE = 20;

export const useMediaStore = defineStore('websiteMedia', () => {
  const items = ref<MediaItem[]>([]);
  const total = ref(0);
  const page = ref(1);
  const typeFilter = ref<string | undefined>(undefined);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchMedia(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await listMedia({ page: page.value, pageSize: PAGE_SIZE, type: typeFilter.value });
      items.value = result.items;
      total.value = result.totalCount;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load media';
    } finally {
      isLoading.value = false;
    }
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

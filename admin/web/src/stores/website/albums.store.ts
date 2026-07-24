import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listAlbums, createAlbum, updateAlbum, deleteAlbum } from '@/api/website';
import type { Album, AlbumInput } from '@/api/websiteTypes';

export const useAlbumsStore = defineStore('websiteAlbums', () => {
  const albums = ref<Album[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAlbums(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      albums.value = await listAlbums();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load albums';
    } finally {
      isLoading.value = false;
    }
  }

  async function saveAlbum(input: AlbumInput, id?: string): Promise<void> {
    if (id) {
      await updateAlbum(id, input);
    } else {
      await createAlbum(input);
    }
    await fetchAlbums();
  }

  async function removeAlbum(id: string): Promise<void> {
    await deleteAlbum(id);
    albums.value = albums.value.filter((a) => a.id !== id);
  }

  return { albums, isLoading, error, fetchAlbums, saveAlbum, removeAlbum };
});

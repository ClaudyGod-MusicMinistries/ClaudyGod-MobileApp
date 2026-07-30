import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listAlbums, createAlbum, updateAlbum, deleteAlbum } from '@/api/website';
import type { Album, AlbumInput } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

export const useAlbumsStore = defineStore('websiteAlbums', () => {
  const albums = ref<Album[]>([]);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchAlbums(): Promise<void> {
    await execute(listAlbums, (result) => { albums.value = result; });
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

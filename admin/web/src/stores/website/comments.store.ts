import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listComments, updateCommentStatus, deleteComment } from '@/api/website';
import type { AdminComment } from '@/api/websiteTypes';

const PAGE_SIZE = 20;

export const useCommentsStore = defineStore('websiteComments', () => {
  const items = ref<AdminComment[]>([]);
  const total = ref(0);
  const page = ref(1);
  const statusFilter = ref<string | undefined>('Pending');
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchComments(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await listComments({ page: page.value, pageSize: PAGE_SIZE, status: statusFilter.value });
      items.value = result.items;
      total.value = result.totalCount;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load comments';
    } finally {
      isLoading.value = false;
    }
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchComments();
  }

  function setStatusFilter(status: string | undefined): void {
    statusFilter.value = status;
    page.value = 1;
    void fetchComments();
  }

  async function changeStatus(id: string, status: string): Promise<void> {
    await updateCommentStatus(id, status);
    await fetchComments();
  }

  async function removeComment(id: string): Promise<void> {
    await deleteComment(id);
    await fetchComments();
  }

  return {
    items,
    total,
    page,
    statusFilter,
    isLoading,
    error,
    pageSize: PAGE_SIZE,
    fetchComments,
    setPage,
    setStatusFilter,
    changeStatus,
    removeComment,
  };
});

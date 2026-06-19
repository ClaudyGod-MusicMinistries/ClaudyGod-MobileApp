import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import {
  listContent,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  bulkUpdateContent,
  listRequests,
  updateRequestStatus,
} from '@/api/content';
import type {
  ContentItem,
  ContentCreateInput,
  ContentUpdateInput,
  ContentRequest,
  PaginatedResponse,
} from '@/api/types';
import type { ContentListParams, RequestListParams } from '@/api/content';

export const useContentStore = defineStore('content', () => {
  // Content list
  const items = ref<ContentItem[]>([]);
  const total = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const filters = reactive<ContentListParams>({
    type: undefined,
    status: undefined,
    section: undefined,
    search: undefined,
    page: 1,
    pageSize: 20,
    sort: 'createdAt',
    sortDir: 'desc',
  });

  // Editing
  const current = ref<ContentItem | null>(null);
  const isSaving = ref(false);
  const saveError = ref<string | null>(null);

  // Requests
  const requests = ref<ContentRequest[]>([]);
  const requestsTotal = ref(0);
  const requestsLoading = ref(false);

  async function fetchContent(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const res: PaginatedResponse<ContentItem> = await listContent(filters);
      items.value = res.items;
      total.value = res.total;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load content';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchOne(id: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      current.value = await getContent(id);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load item';
    } finally {
      isLoading.value = false;
    }
  }

  async function save(input: ContentCreateInput | ContentUpdateInput): Promise<ContentItem> {
    isSaving.value = true;
    saveError.value = null;
    try {
      const result = 'id' in input
        ? await updateContent(input as ContentUpdateInput)
        : await createContent(input as ContentCreateInput);
      current.value = result;
      return result;
    } catch (e) {
      saveError.value = e instanceof Error ? e.message : 'Failed to save';
      throw e;
    } finally {
      isSaving.value = false;
    }
  }

  async function remove(id: string): Promise<void> {
    await deleteContent(id);
    items.value = items.value.filter((i) => i.id !== id);
    total.value = Math.max(0, total.value - 1);
  }

  async function bulkAction(ids: string[], patch: Partial<ContentUpdateInput>): Promise<void> {
    try {
      await bulkUpdateContent(ids, patch);
      await fetchContent();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Bulk operation failed';
      throw e;
    }
  }

  async function fetchRequests(params?: RequestListParams): Promise<void> {
    requestsLoading.value = true;
    try {
      const res = await listRequests(params);
      requests.value = res.items;
      requestsTotal.value = res.total;
    } finally {
      requestsLoading.value = false;
    }
  }

  async function updateRequest(id: string, status: string, notes?: string): Promise<void> {
    const updated = await updateRequestStatus(id, status, notes);
    requests.value = requests.value.map((r) => (r.id === id ? updated : r));
  }

  function resetCurrent(): void {
    current.value = null;
    saveError.value = null;
  }

  return {
    items, total, isLoading, error, filters, current, isSaving, saveError,
    requests, requestsTotal, requestsLoading,
    fetchContent, fetchOne, save, remove, bulkAction,
    fetchRequests, updateRequest, resetCurrent,
  };
});

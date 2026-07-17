import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listSessions, createSession, updateSession, deleteSession, getSessionDetail, updateMessageStatus } from '@/api/live';
import type { LiveSession, LiveSessionDetail, LiveSessionInput } from '@/api/types';

export const useLiveStore = defineStore('live', () => {
  const sessions = ref<LiveSession[]>([]);
  const total = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isSaving = ref(false);
  const activeDetail = ref<LiveSessionDetail | null>(null);
  const detailLoading = ref(false);

  async function fetchSessions(status?: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await listSessions({ status, pageSize: 50 });
      sessions.value = res.items;
      total.value = res.total;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load sessions';
    } finally {
      isLoading.value = false;
    }
  }

  async function create(input: LiveSessionInput): Promise<LiveSession> {
    isSaving.value = true;
    try {
      const session = await createSession(input);
      sessions.value.unshift(session);
      total.value++;
      return session;
    } finally {
      isSaving.value = false;
    }
  }

  async function update(id: string, input: Partial<LiveSessionInput> & { status?: string }): Promise<void> {
    const updated = await updateSession(id, input);
    sessions.value = sessions.value.map((s) => (s.id === id ? updated : s));
  }

  async function remove(id: string): Promise<void> {
    await deleteSession(id);
    sessions.value = sessions.value.filter((s) => s.id !== id);
    total.value = Math.max(0, total.value - 1);
  }

  async function loadDetail(id: string): Promise<void> {
    detailLoading.value = true;
    try {
      activeDetail.value = await getSessionDetail(id);
    } finally {
      detailLoading.value = false;
    }
  }

  async function moderateMessage(sessionId: string, messageId: string, status: 'visible' | 'hidden'): Promise<void> {
    const updated = await updateMessageStatus(sessionId, messageId, status);
    if (activeDetail.value?.id === sessionId) {
      activeDetail.value = {
        ...activeDetail.value,
        messages: activeDetail.value.messages.map((m) => (m.id === messageId ? updated : m)),
      };
    }
  }

  function clearDetail(): void {
    activeDetail.value = null;
  }

  return {
    sessions, total, isLoading, error, isSaving, fetchSessions, create, update, remove,
    activeDetail, detailLoading, loadDetail, moderateMessage, clearDetail,
  };
});

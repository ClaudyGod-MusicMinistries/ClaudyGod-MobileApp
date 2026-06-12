import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listSessions, createSession, updateSession, deleteSession } from '@/api/live';
import type { LiveSession, LiveSessionInput } from '@/api/types';

export const useLiveStore = defineStore('live', () => {
  const sessions = ref<LiveSession[]>([]);
  const total = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isSaving = ref(false);

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

  return { sessions, total, isLoading, error, isSaving, fetchSessions, create, update, remove };
});

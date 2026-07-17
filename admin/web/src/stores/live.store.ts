import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listSessions, createSession, updateSession, deleteSession, getSessionDetail, updateMessageStatus } from '@/api/live';
import type { LiveSession, LiveSessionDetail, LiveSessionInput, LiveMessage } from '@/api/types';
import type { LiveSocketFrame } from '@/composables/useLiveSocket';

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

  // Applies a WebSocket frame from useLiveSocket to both the sessions list row
  // and the open chat modal (if it's the same session) — same "patch both if
  // id matches" shape moderateMessage already uses for REST-driven updates.
  function applyRealtimeEvent(sessionId: string, event: LiveSocketFrame): void {
    if (event.type === 'viewer_count') {
      const { count } = event.payload as { count: number };
      sessions.value = sessions.value.map((s) => (s.id === sessionId ? { ...s, viewerCount: count } : s));
      if (activeDetail.value?.id === sessionId) {
        activeDetail.value = { ...activeDetail.value, viewerCount: count };
      }
      return;
    }

    if (event.type === 'session_update') {
      const update = event.payload as Partial<LiveSession>;
      sessions.value = sessions.value.map((s) => (s.id === sessionId ? { ...s, ...update } : s));
      if (activeDetail.value?.id === sessionId) {
        activeDetail.value = { ...activeDetail.value, ...update };
      }
      return;
    }

    if (activeDetail.value?.id !== sessionId) return;

    if (event.type === 'message') {
      const incoming = event.payload as LiveMessage;
      if (activeDetail.value.messages.some((m) => m.id === incoming.id)) return;
      activeDetail.value = {
        ...activeDetail.value,
        messageCount: activeDetail.value.messageCount + 1,
        messages: [incoming, ...activeDetail.value.messages],
      };
      return;
    }

    if (event.type === 'message_status') {
      const { id, status } = event.payload as { id: string; status: 'visible' | 'hidden' };
      activeDetail.value = {
        ...activeDetail.value,
        messages: activeDetail.value.messages.map((m) => (m.id === id ? { ...m, visibility: status } : m)),
      };
    }
  }

  return {
    sessions, total, isLoading, error, isSaving, fetchSessions, create, update, remove,
    activeDetail, detailLoading, loadDetail, moderateMessage, clearDetail, applyRealtimeEvent,
  };
});

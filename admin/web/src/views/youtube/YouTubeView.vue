<template>
  <div class="space-y-5">
    <h2 class="text-base font-bold text-ink">YouTube sync</h2>

    <!-- Status card -->
    <AppCard class="p-5">
      <div class="flex items-start justify-between gap-6">
        <div class="space-y-1">
          <p class="text-xs font-semibold text-ink-muted uppercase tracking-wide">Channel</p>
          <p class="text-base font-bold text-ink">{{ syncStatus?.channelTitle || 'Not configured' }}</p>
          <p v-if="syncStatus?.channelId" class="text-xs text-ink-muted">{{ syncStatus.channelId }}</p>
          <p class="text-xs text-ink-muted mt-2">
            Last synced: {{ syncStatus?.lastSyncedAt ? formatDate(syncStatus.lastSyncedAt) : 'Never' }}
          </p>
          <p class="text-xs text-ink-muted">{{ syncStatus?.videoCount ?? 0 }} videos tracked</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <StatusBadge :status="syncStatus?.status ?? 'idle'" />
          <AppButton
            size="sm"
            :loading="syncing"
            :disabled="syncStatus?.status === 'syncing'"
            @click="triggerSync"
          >
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </template>
            Sync now
          </AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Import queue -->
    <div class="space-y-3">
      <h3 class="text-sm font-bold text-ink">Import queue</h3>
      <AppCard>
        <AppTable :columns="columns" :rows="importQueue as Record<string, unknown>[]" :loading="isLoading">
          <template #cell-status="{ value }">
            <StatusBadge :status="String(value)" />
          </template>
          <template #cell-importedAt="{ value }">
            <span class="text-xs text-ink-muted">{{ value ? formatDate(String(value)) : '—' }}</span>
          </template>
        </AppTable>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getSyncStatus, triggerSync as apiTriggerSync, listImportQueue } from '@/api/youtube';
import { useUiStore } from '@/stores/ui.store';
import type { YouTubeSyncStatus, YouTubeImportItem } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';

const ui = useUiStore();
const syncStatus = ref<YouTubeSyncStatus | null>(null);
const importQueue = ref<YouTubeImportItem[]>([]);
const isLoading = ref(false);
const syncing = ref(false);

const columns = [
  { key: 'title', label: 'Video title' },
  { key: 'videoId', label: 'Video ID' },
  { key: 'status', label: 'Status' },
  { key: 'importedAt', label: 'Imported', align: 'right' as const },
];

onMounted(async () => {
  isLoading.value = true;
  try {
    [syncStatus.value, importQueue.value] = await Promise.all([getSyncStatus(), listImportQueue()]);
  } finally {
    isLoading.value = false;
  }
});

async function triggerSync(): Promise<void> {
  syncing.value = true;
  try {
    const { queued } = await apiTriggerSync();
    ui.addToast({ tone: 'success', title: `Sync started — ${queued} videos queued` });
    syncStatus.value = await getSyncStatus();
  } catch (e) {
    ui.addToast({ tone: 'error', title: 'Sync failed', message: e instanceof Error ? e.message : undefined });
  } finally {
    syncing.value = false;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

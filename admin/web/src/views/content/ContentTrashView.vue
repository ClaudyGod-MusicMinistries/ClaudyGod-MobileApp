<template>
  <div class="space-y-4">
    <PageHeader icon="trash" tone="danger" title="Trash" :subtitle="`${store.trashTotal} deleted item${store.trashTotal !== 1 ? 's' : ''}`">
      <RouterLink to="/content">
        <AppButton variant="secondary" size="sm">Back to content</AppButton>
      </RouterLink>
    </PageHeader>

    <AppCard>
      <AppEmptyState
        v-if="!store.trashLoading && !store.trashItems.length"
        title="Trash is empty"
        message="Deleted content shows up here and can be restored."
      />
      <AppResponsiveTable
        v-else
        :columns="columns"
        :rows="store.trashItems as Record<string, unknown>[]"
        :loading="store.trashLoading"
      >
        <template #cell-title="{ row }">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-white/8 overflow-hidden flex-shrink-0">
              <img v-if="row.thumbnailUrl" :src="row.thumbnailUrl as string" alt="" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
              </div>
            </div>
            <span class="text-sm font-medium text-ink line-clamp-1">{{ row.title }}</span>
          </div>
        </template>
        <template #cell-type="{ value }">
          <AppBadge tone="neutral">{{ value }}</AppBadge>
        </template>
        <template #cell-visibility="{ value }">
          <StatusBadge :status="String(value)" />
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <AppButton size="xs" variant="secondary" :loading="busyId === row.id" @click="onRestore(row)">Restore</AppButton>
            <AppButton size="xs" variant="ghost" class="text-danger" title="Delete forever" :loading="busyId === row.id" @click="onPermanentDelete(row)">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useContentStore } from '@/stores/content.store';
import { useUiStore } from '@/stores/ui.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import PageHeader from '@/components/shared/PageHeader.vue';

const store = useContentStore();
const ui = useUiStore();
const busyId = ref<string | null>(null);

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'visibility', label: 'Status' },
];

onMounted(() => { void store.fetchTrash(); });

async function onRestore(row: Record<string, unknown>): Promise<void> {
  busyId.value = row.id as string;
  try {
    await store.restore(row.id as string);
    ui.addToast({ tone: 'success', title: `"${row.title}" restored` });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Restore failed', message: e instanceof Error ? e.message : undefined });
  } finally {
    busyId.value = null;
  }
}

async function onPermanentDelete(row: Record<string, unknown>): Promise<void> {
  const ok = await ui.confirm({
    title: 'Delete forever',
    message: `Permanently delete "${row.title}"? This cannot be undone.`,
    tone: 'danger',
    confirmLabel: 'Delete forever',
  });
  if (!ok) return;
  busyId.value = row.id as string;
  try {
    await store.permanentlyDelete(row.id as string);
    ui.addToast({ tone: 'success', title: 'Permanently deleted' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Delete failed', message: e instanceof Error ? e.message : undefined });
  } finally {
    busyId.value = null;
  }
}
</script>

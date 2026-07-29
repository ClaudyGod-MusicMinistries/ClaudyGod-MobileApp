<template>
  <div class="space-y-5">
    <WebPageHeader
      :icon="Trash2"
      title="Trash"
      subtitle="Recently removed items from every section. Restore what you need, or delete forever — anything left for 30 days is cleared automatically."
    />

    <AppCard class="p-4">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <AppSelect
          :model-value="store.entityTypeFilter ?? ''"
          :options="typeOptions"
          placeholder="All types"
          class="w-56"
          @update:model-value="(v) => store.setEntityTypeFilter((v || undefined) as TrashEntityType | undefined)"
        />
        <AppButton variant="danger" size="sm" :disabled="store.total === 0" @click="confirmEmpty">
          Empty trash
        </AppButton>
      </div>
    </AppCard>

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-title="{ row }">
          <div>
            <p class="text-sm font-medium text-ink">{{ row.title }}</p>
            <p class="text-xs text-ink-muted">{{ row.subtitle }}</p>
          </div>
        </template>
        <template #cell-entityType="{ value }">
          <AppBadge tone="neutral">{{ typeLabel(value as TrashEntityType) }}</AppBadge>
        </template>
        <template #cell-deletedAt="{ value }">
          <span class="text-xs text-ink-muted" :title="exactDateTime(value as string)">
            {{ relativeTime(value as string) }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton variant="secondary" size="xs" @click="restore(row as unknown as TrashItem)">Restore</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmRemoveForever(row as unknown as TrashItem)">
              Delete forever
            </AppButton>
          </div>
        </template>
        <template #empty>
          <div class="py-10 text-center">
            <Trash2 class="w-8 h-8 text-ink-muted mx-auto mb-2" />
            <p class="text-sm text-ink-soft">Trash is empty</p>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Trash2 } from 'lucide-vue-next';
import { useTrashStore } from '@/stores/website/trash.store';
import { useUiStore } from '@/stores/ui.store';
import type { TrashItem, TrashEntityType } from '@/api/websiteTypes';
import { relativeTime, exactDateTime } from '@/utils/relativeTime';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useTrashStore();
const ui = useUiStore();

onMounted(() => { void store.fetchTrash(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'title', label: 'Item' },
  { key: 'entityType', label: 'Type' },
  { key: 'deletedAt', label: 'Deleted', align: 'right' as const },
];

const TYPE_LABELS: Record<TrashEntityType, string> = {
  Album: 'Album',
  Product: 'Store product',
  MediaItem: 'Video/media',
  FAQ: 'FAQ',
  Event: 'Event',
  BlogPost: 'Journal post',
  Booking: 'Booking',
  ContactMessage: 'Contact message',
  Volunteer: 'Volunteer application',
  PrayerRequest: 'Prayer request',
  TicketReservation: 'Ticket reservation',
  Subscriber: 'Subscriber',
  Comment: 'Journal comment',
};

function typeLabel(type: TrashEntityType): string {
  return TYPE_LABELS[type] ?? type;
}

const typeOptions = (Object.keys(TYPE_LABELS) as TrashEntityType[]).map((value) => ({
  value,
  label: TYPE_LABELS[value],
}));

async function restore(item: TrashItem): Promise<void> {
  try {
    await store.restore(item.entityType, item.id);
    ui.addToast({ tone: 'success', title: 'Restored', message: `"${item.title}" is back in ${typeLabel(item.entityType)}.` });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Restore failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

async function confirmRemoveForever(item: TrashItem): Promise<void> {
  const ok = await ui.confirm({
    title: 'Delete forever',
    message: `Permanently delete "${item.title}"? This can't be undone.`,
    confirmLabel: 'Delete forever',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeForever(item.entityType, item.id);
    ui.addToast({ tone: 'success', title: 'Deleted permanently' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Delete failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

async function confirmEmpty(): Promise<void> {
  const ok = await ui.confirm({
    title: 'Empty trash',
    message: `Permanently delete all ${store.total} item${store.total === 1 ? '' : 's'} in trash? This can't be undone.`,
    confirmLabel: 'Empty trash',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.empty();
    ui.addToast({ tone: 'success', title: 'Trash emptied' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to empty trash', message: e instanceof Error ? e.message : 'Please try again' });
  }
}
</script>

<template>
  <div class="space-y-5">
    <WebPageHeader :icon="Users2" title="Subscribers" subtitle="Newsletter subscribers from the site's signup form" />

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-name="{ row }">
          <p class="text-sm font-medium text-ink">{{ row.name || '—' }}</p>
        </template>
        <template #cell-email="{ value }">
          <span class="text-sm text-ink-soft">{{ value }}</span>
        </template>
        <template #cell-isActive="{ value }">
          <AppBadge :tone="value ? 'success' : 'neutral'">{{ value ? 'Active' : 'Unsubscribed' }}</AppBadge>
        </template>
        <template #cell-createdAt="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(value as string) }}</span>
        </template>
        <template #actions="{ row }">
          <AppButton variant="danger" size="xs" @click="confirmTrash(row as unknown as Subscriber)">Move to trash</AppButton>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Users2 } from 'lucide-vue-next';
import { useSubscribersStore } from '@/stores/website/subscribers.store';
import { useUiStore } from '@/stores/ui.store';
import type { Subscriber } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useSubscribersStore();
const ui = useUiStore();

onMounted(() => { void store.fetchSubscribers(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'isActive', label: 'Status' },
  { key: 'createdAt', label: 'Subscribed', align: 'right' as const },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function confirmTrash(subscriber: Subscriber): Promise<void> {
  const ok = await ui.confirm({
    title: 'Move to trash',
    message: `Move "${subscriber.name || subscriber.email}" to Trash? You can restore it anytime within 30 days.`,
    confirmLabel: 'Move to trash',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeSubscriber(subscriber.id);
    ui.addToast({ tone: 'success', title: 'Moved to trash' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Move to trash failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}
</script>

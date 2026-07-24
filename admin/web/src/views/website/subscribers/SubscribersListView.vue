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
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Users2 } from 'lucide-vue-next';
import { useSubscribersStore } from '@/stores/website/subscribers.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useSubscribersStore();

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
</script>

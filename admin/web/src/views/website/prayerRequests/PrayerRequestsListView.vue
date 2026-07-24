<template>
  <div class="space-y-5">
    <WebPageHeader :icon="HeartHandshake" title="Prayer requests" subtitle="Submitted through the Prayer page" />

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-name="{ row }">
          <div>
            <p class="text-sm font-medium text-ink">{{ row.name }}</p>
            <p class="text-xs text-ink-muted">{{ row.email }}</p>
          </div>
        </template>
        <template #cell-subject="{ row }">
          <div class="flex items-center gap-2">
            <p class="text-sm text-ink-soft max-w-sm truncate">{{ row.subject }}</p>
            <AppBadge v-if="row.isConfidential" tone="warning">Confidential</AppBadge>
          </div>
        </template>
        <template #cell-status="{ value }">
          <AppBadge tone="neutral">{{ value }}</AppBadge>
        </template>
        <template #cell-createdAt="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(value as string) }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton variant="secondary" size="xs" @click="openDetail(row as unknown as PrayerRequestItem)">View</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmTrash(row as unknown as PrayerRequestItem)">Move to trash</AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />

    <AppModal v-model="detailOpen" title="Prayer request" size="md">
      <div v-if="selected" class="space-y-3 text-sm">
        <AppBadge v-if="selected.isConfidential" tone="warning">Confidential — handle with care</AppBadge>
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">From</p>
          <p class="text-ink">{{ selected.name }} — {{ selected.email }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Subject</p>
          <p class="text-ink">{{ selected.subject }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Request</p>
          <p class="text-ink-soft whitespace-pre-wrap">{{ selected.requestText }}</p>
        </div>
        <div v-if="selected.adminResponse">
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Response sent</p>
          <p class="text-ink-soft whitespace-pre-wrap">{{ selected.adminResponse }}</p>
        </div>
        <div class="pt-2">
          <AppButton size="sm" tag="a" :href="`mailto:${selected.email}`">Reply by email</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { HeartHandshake } from 'lucide-vue-next';
import { usePrayerRequestsStore } from '@/stores/website/prayerRequests.store';
import { useUiStore } from '@/stores/ui.store';
import type { PrayerRequestItem } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = usePrayerRequestsStore();
const ui = useUiStore();

onMounted(() => { void store.fetchPrayerRequests(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'name', label: 'From' },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Received', align: 'right' as const },
];

const detailOpen = ref(false);
const selected = ref<PrayerRequestItem | null>(null);

function openDetail(item: PrayerRequestItem): void {
  selected.value = item;
  detailOpen.value = true;
}

async function confirmTrash(item: PrayerRequestItem): Promise<void> {
  const ok = await ui.confirm({
    title: 'Move to trash',
    message: `Move the prayer request from "${item.name}" to Trash? You can restore it anytime within 30 days.`,
    confirmLabel: 'Move to trash',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removePrayerRequest(item.id);
    ui.addToast({ tone: 'success', title: 'Moved to trash' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Move to trash failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

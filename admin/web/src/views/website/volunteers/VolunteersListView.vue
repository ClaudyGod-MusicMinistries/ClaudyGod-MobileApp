<template>
  <div class="space-y-5">
    <WebPageHeader :icon="HandHeart" title="Volunteers" subtitle="Applications submitted through the Volunteer page" />

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-name="{ row }">
          <div>
            <p class="text-sm font-medium text-ink">{{ row.firstName }} {{ row.lastName }}</p>
            <p class="text-xs text-ink-muted">{{ row.email }}</p>
          </div>
        </template>
        <template #cell-role="{ value }">
          <AppBadge tone="neutral">{{ value }}</AppBadge>
        </template>
        <template #cell-reason="{ row }">
          <p class="text-sm text-ink-soft max-w-md truncate">{{ row.reason }}</p>
        </template>
        <template #cell-isApproved="{ value }">
          <AppBadge :tone="value ? 'success' : 'neutral'">{{ value ? 'Approved' : 'Pending' }}</AppBadge>
        </template>
        <template #cell-createdAt="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(value as string) }}</span>
        </template>
        <template #actions="{ row }">
          <AppButton variant="danger" size="xs" @click="confirmTrash(row as unknown as Volunteer)">Move to trash</AppButton>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { HandHeart } from 'lucide-vue-next';
import { useVolunteersStore } from '@/stores/website/volunteers.store';
import { useUiStore } from '@/stores/ui.store';
import type { Volunteer } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useVolunteersStore();
const ui = useUiStore();

onMounted(() => { void store.fetchVolunteers(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'name', label: 'Applicant' },
  { key: 'role', label: 'Role' },
  { key: 'reason', label: 'Reason' },
  { key: 'isApproved', label: 'Status' },
  { key: 'createdAt', label: 'Applied', align: 'right' as const },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function confirmTrash(volunteer: Volunteer): Promise<void> {
  const ok = await ui.confirm({
    title: 'Move to trash',
    message: `Move the application from "${volunteer.firstName} ${volunteer.lastName}" to Trash? You can restore it anytime within 30 days.`,
    confirmLabel: 'Move to trash',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeVolunteer(volunteer.id);
    ui.addToast({ tone: 'success', title: 'Moved to trash' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Move to trash failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}
</script>

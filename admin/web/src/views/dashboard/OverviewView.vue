<template>
  <div class="space-y-6">
    <!-- Greeting -->
    <div class="mb-2">
      <h1 class="text-2xl font-black text-ink tracking-tight">{{ greeting }}, {{ auth.user?.displayName || 'there' }}.</h1>
      <p class="text-sm text-ink-muted mt-1">Here's what's happening across your ministry today.</p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <AppStatCard label="Total users" :value="summary.totalUsers" icon-bg="bg-primary/15">
        <template #icon>
          <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </template>
      </AppStatCard>
      <AppStatCard label="New (7 days)" :value="summary.newUsersLast7Days" icon-bg="bg-success/15">
        <template #icon>
          <svg class="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        </template>
      </AppStatCard>
      <AppStatCard label="Verified" :value="summary.verifiedUsers" icon-bg="bg-info/15">
        <template #icon>
          <svg class="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
        </template>
      </AppStatCard>
      <AppStatCard label="Content items" :value="summary.totalContent" icon-bg="bg-primary/15">
        <template #icon>
          <svg class="w-5 h-5 text-primary-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </template>
      </AppStatCard>
      <AppStatCard label="Live sessions" :value="summary.liveSessions" icon-bg="bg-danger/15">
        <template #icon>
          <svg class="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M6.343 6.343a8 8 0 000 11.314M17.657 6.343a8 8 0 010 11.314"/></svg>
        </template>
      </AppStatCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Latest content -->
      <div class="lg:col-span-2 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-ink">Latest content</h2>
          <RouterLink to="/content" class="text-xs text-primary hover:underline">View all →</RouterLink>
        </div>
        <AppCard>
          <AppTable
            :columns="contentCols"
            :rows="latestContent"
            :loading="dashboard.isLoading"
          >
            <template #cell-status="{ value }">
              <StatusBadge :status="String(value)" />
            </template>
            <template #cell-type="{ value }">
              <AppBadge tone="neutral">{{ value }}</AppBadge>
            </template>
            <template #cell-createdAt="{ value }">
              <span class="text-xs text-ink-muted">{{ formatDate(String(value)) }}</span>
            </template>
          </AppTable>
        </AppCard>
      </div>

      <!-- Right column -->
      <div class="space-y-4">
        <!-- Request status board -->
        <div>
          <h2 class="text-sm font-bold text-ink mb-3">Content review</h2>
          <AppCard class="p-4 space-y-2">
            <div
              v-for="item in requestBoard"
              :key="item.status"
              class="flex items-center justify-between py-1.5"
            >
              <div class="flex items-center gap-2">
                <StatusBadge :status="item.status" />
              </div>
              <span class="text-sm font-bold text-ink tabular-nums">{{ item.count }}</span>
            </div>
            <AppEmptyState v-if="!requestBoard.length" title="No requests" />
          </AppCard>
        </div>

        <!-- Pending review callout -->
        <div>
          <AppCard class="p-4 flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Pending review</p>
              <p class="text-2xl font-black text-ink tabular-nums mt-1">{{ summary.pendingRequests }}</p>
              <p class="text-xs text-ink-muted mt-0.5">
                {{ dashboard.lastFetchedAt ? `Updated ${formatDate(dashboard.lastFetchedAt.toISOString())}` : 'Loading…' }}
              </p>
            </div>
            <AppButton variant="ghost" size="xs" @click="dashboard.fetchDashboard()">
              Refresh
            </AppButton>
          </AppCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppStatCard from '@/components/ui/AppStatCard.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';

const dashboard = useDashboardStore();
const auth = useAuthStore();

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
});

onMounted(() => { void dashboard.fetchDashboard(); });

const summary = computed(() => dashboard.data?.summary ?? {
  totalUsers: 0, newUsersLast7Days: 0, verifiedUsers: 0,
  totalContent: 0, publishedContent: 0, liveSessions: 0, pendingRequests: 0,
});

const latestContent = computed(() => (dashboard.data?.overview.latestContent ?? []) as Record<string, unknown>[]);
const requestBoard = computed(() => dashboard.data?.overview.requestStatusBoard ?? []);

const contentCols = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Added', align: 'right' as const },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

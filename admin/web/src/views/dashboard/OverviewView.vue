<template>
  <div class="space-y-6">
    <!-- Greeting -->
    <div class="mb-2">
      <h1 class="text-2xl font-black text-ink tracking-tight">{{ greeting }}, {{ auth.user?.displayName || 'there' }}.</h1>
      <p class="text-sm text-ink-muted mt-1">Here's what's happening across your ministry today.</p>
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <RouterLink
        to="/content/new"
        class="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors group"
      >
        <div class="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Plus class="w-5 h-5 text-primary" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-ink leading-none mb-0.5">Add content</p>
          <p class="text-[11px] text-ink-muted truncate">Upload audio or video</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/youtube"
        class="flex items-center gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/20 hover:bg-danger/15 transition-colors group"
      >
        <div class="w-9 h-9 rounded-xl bg-danger/20 flex items-center justify-center shrink-0">
          <Youtube class="w-5 h-5 text-danger" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-ink leading-none mb-0.5">YouTube import</p>
          <p class="text-[11px] text-ink-muted truncate">Assign videos to sections</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/config"
        class="flex items-center gap-3 p-4 rounded-2xl bg-info/10 border border-info/20 hover:bg-info/15 transition-colors group"
      >
        <div class="w-9 h-9 rounded-xl bg-info/20 flex items-center justify-center shrink-0">
          <Smartphone class="w-5 h-5 text-info" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-ink leading-none mb-0.5">Mobile config</p>
          <p class="text-[11px] text-ink-muted truncate">Sections, giving, nav</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/users"
        class="flex items-center gap-3 p-4 rounded-2xl bg-success/10 border border-success/20 hover:bg-success/15 transition-colors group"
      >
        <div class="w-9 h-9 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
          <Users2 class="w-5 h-5 text-success" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-ink leading-none mb-0.5">Manage users</p>
          <p class="text-[11px] text-ink-muted truncate">Roles & permissions</p>
        </div>
      </RouterLink>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <AppStatCard label="Total users" :value="summary.totalUsers" icon-bg="bg-primary/15">
        <template #icon><Users class="w-5 h-5 text-primary" /></template>
      </AppStatCard>
      <AppStatCard label="New (7 days)" :value="summary.newUsersLast7Days" icon-bg="bg-success/15">
        <template #icon><TrendingUp class="w-5 h-5 text-success" /></template>
      </AppStatCard>
      <AppStatCard label="Verified" :value="summary.verifiedUsers" icon-bg="bg-info/15">
        <template #icon><BadgeCheck class="w-5 h-5 text-info" /></template>
      </AppStatCard>
      <AppStatCard label="Content items" :value="summary.totalContent" icon-bg="bg-primary/15">
        <template #icon><FileText class="w-5 h-5 text-primary-soft" /></template>
      </AppStatCard>
      <AppStatCard label="Live sessions" :value="summary.liveSessions" icon-bg="bg-danger/15">
        <template #icon><Radio class="w-5 h-5 text-danger" /></template>
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
            <template #cell-visibility="{ value }">
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
import { BadgeCheck, FileText, Plus, Radio, Smartphone, TrendingUp, Users, Users2, Youtube } from 'lucide-vue-next';
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
  { key: 'visibility', label: 'Status' },
  { key: 'createdAt', label: 'Added', align: 'right' as const },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

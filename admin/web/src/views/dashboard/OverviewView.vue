<template>
  <AppPage eyebrow="Mobile operations" :title="`${greeting}, ${firstName}`" description="Monitor publishing, audience activity, and items requiring attention across the mobile experience.">
    <template #actions>
      <AppButton variant="secondary" size="sm" :loading="dashboard.isLoading" @click="dashboard.fetchDashboard()">
        <RefreshCw class="w-4 h-4" />
        Refresh data
      </AppButton>
    </template>

    <AppCard v-if="dashboard.error" class="border-danger/30 bg-danger/10">
      <AppEmptyState title="Mobile dashboard is unavailable" :message="dashboard.error">
        <template #action><AppButton size="sm" variant="secondary" @click="dashboard.fetchDashboard">Try again</AppButton></template>
      </AppEmptyState>
    </AppCard>

    <!-- Signals — real, computed operational insights, not decoration -->
    <div v-if="signals.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <div
        v-for="signal in signals"
        :key="signal.id"
        :class="['flex items-start gap-3 p-3.5 rounded-lg border', signalClass(signal.tone)]"
      >
        <component :is="signalIcon(signal.tone)" class="w-4 h-4 mt-0.5 shrink-0" />
        <div class="min-w-0">
          <p class="text-xs font-bold leading-tight">{{ signal.title }}</p>
          <p class="text-[11px] mt-0.5 text-ink-muted leading-snug">{{ signal.detail }}</p>
        </div>
      </div>
    </div>

    <!-- Command bar -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-surface-strong border border-border rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-border">
      <RouterLink
        to="/content/new"
        class="flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors group"
      >
        <div class="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Plus class="w-4 h-4 text-primary" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-ink leading-none mb-0.5">Add content</p>
          <p class="text-[11px] text-ink-muted truncate">Upload audio or video</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/youtube"
        class="flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors group"
      >
        <div class="w-8 h-8 rounded-md bg-danger/10 flex items-center justify-center shrink-0">
          <Youtube class="w-4 h-4 text-danger" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-ink leading-none mb-0.5">YouTube import</p>
          <p class="text-[11px] text-ink-muted truncate">Assign videos to sections</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/config"
        class="flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors group"
      >
        <div class="w-8 h-8 rounded-md bg-info/10 flex items-center justify-center shrink-0">
          <Smartphone class="w-4 h-4 text-info" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-ink leading-none mb-0.5">Mobile config</p>
          <p class="text-[11px] text-ink-muted truncate">Sections, giving, nav</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/users"
        class="flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors group"
      >
        <div class="w-8 h-8 rounded-md bg-success/10 flex items-center justify-center shrink-0">
          <Users2 class="w-4 h-4 text-success" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-ink leading-none mb-0.5">Manage users</p>
          <p class="text-[11px] text-ink-muted truncate">Roles & permissions</p>
        </div>
      </RouterLink>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      <AppStatCard label="Total users" :value="summary.totalUsers" icon-bg="bg-primary/15">
        <template #icon><Users class="w-4 h-4 text-primary" /></template>
      </AppStatCard>
      <AppStatCard label="New (7 days)" :value="summary.newUsersLast7Days" icon-bg="bg-success/15">
        <template #icon><TrendingUp class="w-4 h-4 text-success" /></template>
      </AppStatCard>
      <AppStatCard label="Verified" :value="summary.verifiedUsers" icon-bg="bg-info/15">
        <template #icon><BadgeCheck class="w-4 h-4 text-info" /></template>
      </AppStatCard>
      <AppStatCard label="Content items" :value="summary.totalContent" icon-bg="bg-primary/15">
        <template #icon><FileText class="w-4 h-4 text-primary-soft" /></template>
      </AppStatCard>
      <AppStatCard label="Live sessions" :value="summary.liveSessions" icon-bg="bg-danger/15">
        <template #icon><Radio class="w-4 h-4 text-danger" /></template>
      </AppStatCard>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <!-- Latest content -->
      <section class="xl:col-span-2 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-ink">Latest content</h2>
            <p class="text-xs text-ink-muted mt-0.5">Recently created publishing records</p>
          </div>
          <RouterLink to="/content" class="text-xs font-semibold text-primary hover:text-primary-soft">View content</RouterLink>
        </div>
        <AppCard>
          <AppResponsiveTable
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
          </AppResponsiveTable>
        </AppCard>
      </section>

      <!-- Right column -->
      <aside class="space-y-4">
        <!-- Request status board -->
        <div>
          <h2 class="text-sm font-semibold text-ink mb-3">Review queue</h2>
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

        <div>
          <AppCard class="p-4 flex items-center justify-between gap-4" tone="subtle">
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
      </aside>
    </div>
  </AppPage>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { AlertTriangle, BadgeCheck, CheckCircle2, FileText, Info, Plus, Radio, RefreshCw, Smartphone, TrendingUp, Users, Users2, Youtube } from 'lucide-vue-next';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import type { DashboardSignal } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppStatCard from '@/components/ui/AppStatCard.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppPage from '@/components/ui/AppPage.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';

const dashboard = useDashboardStore();
const auth = useAuthStore();
const firstName = computed(() => auth.user?.displayName?.trim().split(/\s+/)[0] || 'Administrator');

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
const signals = computed(() => dashboard.data?.smartInsights ?? []);

function signalClass(tone: DashboardSignal['tone']): string {
  return {
    warning: 'bg-amber/10 border-amber/20 text-amber',
    info: 'bg-info/10 border-info/20 text-info',
    success: 'bg-success/10 border-success/20 text-success',
  }[tone];
}

function signalIcon(tone: DashboardSignal['tone']) {
  return { warning: AlertTriangle, info: Info, success: CheckCircle2 }[tone];
}

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

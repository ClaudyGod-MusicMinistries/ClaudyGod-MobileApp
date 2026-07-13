<template>
  <div class="space-y-6">
    <PageHeader icon="analytics" title="Analytics" />

    <!-- KPI cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AppStatCard label="Total plays" :value="overview?.totalPlays ?? 0" icon-bg="bg-primary/15">
        <template #icon>
          <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </template>
      </AppStatCard>
      <AppStatCard label="Unique listeners" :value="overview?.uniqueListeners ?? 0" icon-bg="bg-info/15">
        <template #icon>
          <svg class="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </template>
      </AppStatCard>
      <AppStatCard label="Avg completion" :value="`${(overview?.avgCompletionPct ?? 0).toFixed(0)}%`" icon-bg="bg-success/15">
        <template #icon>
          <svg class="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </template>
      </AppStatCard>
      <AppStatCard v-if="overview?.topContent" :label="'Top content'" :value="overview.topContent.plays" :caption="overview.topContent.title" icon-bg="bg-amber/15">
        <template #icon>
          <svg class="w-5 h-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
        </template>
      </AppStatCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Content performance -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-ink">Content performance</h3>
        <AppCard>
          <AppResponsiveTable
            :columns="insightCols"
            :rows="insights as Record<string, unknown>[]"
            :loading="isLoading"
          >
            <template #cell-type="{ value }">
              <AppBadge tone="neutral">{{ value }}</AppBadge>
            </template>
            <template #cell-plays="{ value }">
              <span class="tabular-nums font-semibold text-ink">{{ value }}</span>
            </template>
            <template #cell-avgCompletionPct="{ value }">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-white/8 rounded-full h-1.5 max-w-20">
                  <div class="bg-primary h-1.5 rounded-full" :style="{ width: `${Math.min(Number(value), 100)}%` }" />
                </div>
                <span class="text-xs text-ink-muted tabular-nums">{{ (Number(value)).toFixed(0) }}%</span>
              </div>
            </template>
          </AppResponsiveTable>
        </AppCard>
      </div>

      <!-- Community insights -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-ink">Community insights</h3>
        <div class="space-y-2">
          <AppCard
            v-for="insight in community"
            :key="insight.message"
            class="p-4 flex items-center gap-4"
          >
            <div :class="['w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', trendBg(insight.trend)]">
              <svg v-if="insight.trend === 'up'" class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
              <svg v-else-if="insight.trend === 'down'" class="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              <svg v-else class="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/></svg>
            </div>
            <p class="text-sm text-ink-soft flex-1">{{ insight.message }}</p>
            <span v-if="insight.value !== null" class="text-sm font-bold text-ink tabular-nums">{{ insight.value }}</span>
          </AppCard>
          <AppEmptyState v-if="!community.length && !isLoading" title="No insights available" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getEngagementOverview, getContentInsights, getCommunityInsights } from '@/api/analytics';
import type { EngagementOverview, ContentInsight, CommunityInsight } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppStatCard from '@/components/ui/AppStatCard.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import PageHeader from '@/components/shared/PageHeader.vue';

const isLoading = ref(false);
const overview = ref<EngagementOverview | null>(null);
const insights = ref<ContentInsight[]>([]);
const community = ref<CommunityInsight[]>([]);

const insightCols = [
  { key: 'title', label: 'Content' },
  { key: 'type', label: 'Type' },
  { key: 'plays', label: 'Plays', sortable: true, align: 'right' as const },
  { key: 'avgCompletionPct', label: 'Completion' },
];

onMounted(async () => {
  isLoading.value = true;
  try {
    const [overviewResult, insightsResult, communityResult] = await Promise.allSettled([
      getEngagementOverview(),
      getContentInsights({ limit: 20 }),
      getCommunityInsights(),
    ]);
    if (overviewResult.status === 'fulfilled') overview.value = overviewResult.value;
    if (insightsResult.status === 'fulfilled') insights.value = insightsResult.value;
    if (communityResult.status === 'fulfilled') community.value = communityResult.value;
  } finally {
    isLoading.value = false;
  }
});

function trendBg(trend: string): string {
  return { up: 'bg-success/15', down: 'bg-danger/15', stable: 'bg-white/8' }[trend] ?? 'bg-white/8';
}
</script>

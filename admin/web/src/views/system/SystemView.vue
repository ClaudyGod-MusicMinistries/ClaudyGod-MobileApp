<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-bold text-ink">System health</h2>
      <AppButton variant="secondary" size="sm" :loading="isLoading" @click="refresh">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </template>
        Refresh
      </AppButton>
    </div>

    <div v-if="isLoading && !health" class="flex items-center justify-center py-20">
      <AppSpinner size="lg" />
    </div>

    <template v-else-if="health">
      <!-- Overall status -->
      <AppCard class="p-5 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-ink-muted uppercase tracking-wide">Overall status</p>
          <p class="text-xl font-bold text-ink mt-0.5 capitalize">{{ health.status }}</p>
          <p class="text-xs text-ink-muted mt-1">Last checked: {{ formatDate(health.timestamp) }}</p>
        </div>
        <StatusBadge :status="health.status" />
      </AppCard>

      <!-- Services grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AppCard
          v-for="(svc, name) in health.services"
          :key="name"
          class="p-4 space-y-2"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-ink capitalize">{{ name }}</p>
            <StatusBadge :status="svc.status" />
          </div>
          <p v-if="svc.latencyMs !== undefined" class="text-xs text-ink-muted">{{ svc.latencyMs }}ms</p>
          <p v-if="svc.detail" class="text-xs text-ink-muted truncate">{{ svc.detail }}</p>
        </AppCard>
      </div>

      <!-- Queue depths -->
      <div v-if="health.queues && Object.keys(health.queues).length" class="space-y-3">
        <h3 class="text-sm font-bold text-ink">Queue depths</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <AppCard v-for="(q, name) in health.queues" :key="name" class="p-4 space-y-1">
            <p class="text-xs font-semibold text-ink-muted capitalize">{{ name }}</p>
            <div class="flex gap-3 mt-1 text-xs">
              <span class="text-ink-soft">Waiting: <span class="text-ink font-bold">{{ q.waiting }}</span></span>
              <span class="text-ink-soft">Active: <span class="text-info font-bold">{{ q.active }}</span></span>
              <span class="text-ink-soft">Failed: <span class="text-danger font-bold">{{ q.failed }}</span></span>
            </div>
          </AppCard>
        </div>
      </div>

      <!-- Raw JSON -->
      <div class="space-y-2">
        <button type="button" class="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors" @click="showRaw = !showRaw">
          <svg :class="['w-3.5 h-3.5 transition-transform', showRaw ? 'rotate-90' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          {{ showRaw ? 'Hide' : 'Show' }} raw response
        </button>
        <AppCard v-if="showRaw" class="p-4">
          <pre class="text-xs text-ink-soft overflow-x-auto">{{ JSON.stringify(health, null, 2) }}</pre>
        </AppCard>
      </div>
    </template>

    <AppEmptyState v-else-if="loadError" :title="loadError" message="Unable to reach the health endpoint.">
      <template #action><AppButton size="sm" @click="refresh">Retry</AppButton></template>
    </AppEmptyState>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getHealth } from '@/api/system';
import type { HealthCheck } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';

const health = ref<HealthCheck | null>(null);
const isLoading = ref(false);
const loadError = ref('');
const showRaw = ref(false);

onMounted(() => { void refresh(); });

async function refresh(): Promise<void> {
  isLoading.value = true;
  loadError.value = '';
  try {
    health.value = await getHealth();
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Health check failed';
  } finally {
    isLoading.value = false;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
</script>

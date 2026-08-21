<template>
  <div class="space-y-5">
    <PageHeader icon="system" title="System health">
      <AppButton variant="secondary" size="sm" :loading="isLoading" @click="refresh">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </template>
        Refresh
      </AppButton>
    </PageHeader>

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

      <section class="space-y-3">
        <div class="flex items-end justify-between gap-3">
          <div><h3 class="text-sm font-semibold text-ink">Operational jobs</h3><p class="mt-0.5 text-xs text-ink-muted">Durable content events, media security scans, and transactional email delivery.</p></div>
          <select v-model="jobStatus" class="h-9 rounded-xl border border-border bg-surface-strong px-3 text-xs text-ink" @change="loadJobs">
            <option value="">All states</option><option value="failed">Failed</option><option value="quarantined">Quarantined</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option>
          </select>
        </div>
        <AppCard class="overflow-hidden divide-y divide-border">
          <div v-for="job in jobs" :key="`${job.kind}-${job.id}`" class="flex items-start gap-3 p-4">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2"><span class="text-[10px] font-medium uppercase tracking-wide text-ink-muted">{{ job.kind }}</span><StatusBadge :status="job.status" /><span class="text-xs text-ink-muted">{{ job.type }}</span></div>
              <p class="mt-1 truncate text-sm font-medium text-ink">{{ job.summary }}</p>
              <p v-if="job.error" class="mt-1 line-clamp-2 text-xs text-danger">{{ job.error }}</p>
              <p class="mt-1 text-[10px] text-ink-muted">Created {{ formatDate(job.createdAt) }}</p>
            </div>
            <AppButton v-if="job.status === 'failed'" variant="secondary" size="xs" :loading="retryingJob === `${job.kind}-${job.id}`" @click="retryJob(job)">Retry</AppButton>
          </div>
          <p v-if="!jobs.length" class="p-8 text-center text-xs text-ink-muted">No jobs match this state.</p>
        </AppCard>
      </section>

      <section class="space-y-3">
        <div><h3 class="text-sm font-semibold text-ink">Security audit</h3><p class="mt-0.5 text-xs text-ink-muted">Recent authentication and privileged mutation evidence.</p></div>
        <AppCard class="divide-y divide-border overflow-hidden">
          <div v-for="event in auditEvents" :key="event.id" class="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div class="min-w-0"><p class="text-sm font-medium text-ink">{{ readableEvent(event.event) }}</p><p class="mt-0.5 truncate text-xs text-ink-muted">{{ event.actor || event.actorEmail || 'System' }}<span v-if="event.ipAddress"> · {{ event.ipAddress }}</span></p></div>
            <time class="text-[10px] text-ink-muted">{{ formatDate(event.createdAt) }}</time>
            <details v-if="Object.keys(event.metadata).length" class="sm:col-span-2"><summary class="cursor-pointer text-xs text-ink-muted">Event details</summary><pre class="mt-2 overflow-x-auto rounded-lg bg-bg-1 p-3 text-[10px] text-ink-soft">{{ JSON.stringify(event.metadata, null, 2) }}</pre></details>
          </div>
          <p v-if="!auditEvents.length" class="p-8 text-center text-xs text-ink-muted">No audit events are available.</p>
        </AppCard>
      </section>

      <section class="space-y-3">
        <div><h3 class="text-sm font-semibold text-ink">Active sessions</h3><p class="mt-0.5 text-xs text-ink-muted">Authenticated devices across password, OAuth, and biometric session stores.</p></div>
        <AppCard class="divide-y divide-border overflow-hidden">
          <div v-for="session in sessions" :key="`${session.source}-${session.id}`" class="flex items-start gap-3 p-4">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2"><span class="text-sm font-medium text-ink">{{ session.displayName }}</span><StatusBadge :status="session.role" /><span class="text-[10px] uppercase tracking-wide text-ink-muted">{{ session.source }}</span></div>
              <p class="mt-1 truncate text-xs text-ink-muted">{{ session.email }}<span v-if="session.ipAddress"> · {{ session.ipAddress }}</span></p>
              <p class="mt-1 truncate text-[10px] text-ink-muted">Last active {{ formatDate(session.lastUsedAt || session.createdAt) }} · Expires {{ formatDate(session.expiresAt) }}</p>
            </div>
            <AppButton variant="secondary" size="xs" :loading="revokingSession === `${session.source}-${session.id}`" @click="revokeSession(session)">Revoke</AppButton>
          </div>
          <p v-if="!sessions.length" class="p-8 text-center text-xs text-ink-muted">No active sessions.</p>
        </AppCard>
      </section>

      <AppCard class="p-5 space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Mobile media storage</p>
            <p class="mt-1 text-sm font-semibold text-ink">{{ storageHealth?.bucket || 'No bucket configured' }}</p>
            <p class="mt-1 text-xs text-ink-muted">{{ storageHealth?.detail || storageError || 'Checking storage…' }}</p>
          </div>
          <StatusBadge :status="storageHealth?.reachable ? 'ok' : 'error'" />
        </div>
        <div v-if="storageHealth" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-for="(count, status) in storageHealth.sessions" :key="status" class="rounded-xl border border-border bg-bg-1 p-3">
            <p class="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{{ status }}</p>
            <p class="mt-1 text-lg font-bold text-ink">{{ count }}</p>
          </div>
        </div>
        <p v-if="storageHealth?.lastConfirmedAt" class="text-xs text-ink-muted">Last verified upload: {{ formatDate(storageHealth.lastConfirmedAt) }}</p>
      </AppCard>

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
import { getHealth, getStorageHealth, getOperationalJobs, retryOperationalJob, getSecurityAuditEvents, getOperationalSessions, revokeOperationalSession } from '@/api/system';
import type { StorageHealth, OperationalJob, SecurityAuditEvent, OperationalSession } from '@/api/system';
import { useUiStore } from '@/stores/ui.store';
import type { HealthCheck } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSpinner from '@/components/ui/AppSpinner.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import PageHeader from '@/components/shared/PageHeader.vue';

const health = ref<HealthCheck | null>(null);
const isLoading = ref(false);
const loadError = ref('');
const showRaw = ref(false);
const storageHealth = ref<StorageHealth | null>(null);
const storageError = ref('');
const jobs = ref<OperationalJob[]>([]);
const jobStatus = ref<'' | OperationalJob['status']>('');
const retryingJob = ref('');
const auditEvents = ref<SecurityAuditEvent[]>([]);
const sessions = ref<OperationalSession[]>([]);
const revokingSession = ref('');
const ui = useUiStore();

onMounted(() => { void refresh(); });

async function refresh(): Promise<void> {
  isLoading.value = true;
  loadError.value = '';
  storageError.value = '';
  try {
    const [platform, storage, operations, audit, activeSessions] = await Promise.allSettled([getHealth(), getStorageHealth(), getOperationalJobs(jobStatus.value || undefined), getSecurityAuditEvents(), getOperationalSessions()]);
    if (platform.status === 'rejected') throw platform.reason;
    health.value = platform.value;
    if (storage.status === 'fulfilled') storageHealth.value = storage.value;
    else storageError.value = storage.reason instanceof Error ? storage.reason.message : 'Storage check failed';
    if (operations.status === 'fulfilled') jobs.value = operations.value;
    if (audit.status === 'fulfilled') auditEvents.value = audit.value;
    if (activeSessions.status === 'fulfilled') sessions.value = activeSessions.value;
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Health check failed';
  } finally {
    isLoading.value = false;
  }
}

async function revokeSession(session: OperationalSession) {
  const ok = await ui.confirm({ title: 'Revoke session', message: `Immediately sign out ${session.displayName} on this device?`, tone: 'danger', confirmLabel: 'Revoke session' });
  if (!ok) return;
  revokingSession.value = `${session.source}-${session.id}`;
  try {
    await revokeOperationalSession(session);
    sessions.value = sessions.value.filter((item) => item.id !== session.id || item.source !== session.source);
  } finally { revokingSession.value = ''; }
}

async function loadJobs() {
  jobs.value = await getOperationalJobs(jobStatus.value || undefined);
}

async function retryJob(job: OperationalJob) {
  retryingJob.value = `${job.kind}-${job.id}`;
  try { await retryOperationalJob(job); await loadJobs(); }
  finally { retryingJob.value = ''; }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function readableEvent(event: string): string {
  return event.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
</script>

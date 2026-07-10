<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-base font-bold text-ink">Live sessions</h2>
        <p class="text-xs text-ink-muted mt-0.5">{{ store.total }} sessions total</p>
      </div>
      <AppButton size="sm" @click="openCreate">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        </template>
        New session
      </AppButton>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2">
      <AppButton
        v-for="tab in tabs"
        :key="tab.value"
        :variant="activeTab === tab.value ? 'primary' : 'secondary'"
        size="sm"
        @click="activeTab = tab.value; void store.fetchSessions(tab.value)"
      >
        {{ tab.label }}
      </AppButton>
    </div>

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="store.sessions as Record<string, unknown>[]" :loading="store.isLoading">
        <template #cell-status="{ value }">
          <StatusBadge :status="String(value)" />
        </template>
        <template #cell-scheduledAt="{ value }">
          <span class="text-xs text-ink-muted">{{ value ? formatDate(String(value)) : '—' }}</span>
        </template>
        <template #cell-viewerCount="{ value }">
          <span class="tabular-nums text-ink-soft">{{ value }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <AppButton v-if="row.status === 'scheduled'" size="xs" variant="secondary" class="text-danger" :loading="actionLoading" @click="startSession(row)">Go Live</AppButton>
            <AppButton v-if="row.status === 'live'" size="xs" variant="secondary" class="text-ink-soft" :loading="actionLoading" @click="endSession(row)">End</AppButton>
            <AppButton size="xs" variant="ghost" @click="openEdit(row)">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </AppButton>
            <AppButton size="xs" variant="ghost" class="text-danger" @click="deleteSession(row)">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <!-- Create / Edit modal -->
    <AppModal v-model="modalOpen" :title="editTarget ? 'Edit session' : 'New live session'">
      <div class="space-y-4">
        <AppInput v-model="form.title" label="Title" required />
        <AppTextarea v-model="form.description" label="Description" :rows="2" />
        <AppInput v-model="form.scheduledAt" label="Scheduled at" type="datetime-local" />
        <AppSelect v-model="form.visibility" label="Visibility" :options="[{ value: 'published', label: 'Public' }, { value: 'draft', label: 'Private' }]" />
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="modalOpen = false">Cancel</AppButton>
          <AppButton size="sm" :loading="store.isSaving" @click="saveSession">Save</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLiveStore } from '@/stores/live.store';
import { useUiStore } from '@/stores/ui.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';

const store = useLiveStore();
const ui = useUiStore();
const activeTab = ref('scheduled');
const modalOpen = ref(false);
const editTarget = ref<Record<string, unknown> | null>(null);
const actionLoading = ref(false);
const form = ref({ title: '', description: '', scheduledAt: '', visibility: 'published' });

const tabs = [
  { value: 'scheduled', label: 'Upcoming' },
  { value: 'live', label: 'Live now' },
  { value: 'ended', label: 'Ended' },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'viewerCount', label: 'Viewers', align: 'right' as const },
  { key: 'scheduledAt', label: 'Scheduled', align: 'right' as const },
];

onMounted(() => { void store.fetchSessions(activeTab.value); });

function openCreate(): void {
  editTarget.value = null;
  form.value = { title: '', description: '', scheduledAt: '', visibility: 'published' };
  modalOpen.value = true;
}

function openEdit(row: Record<string, unknown>): void {
  editTarget.value = row;
  form.value = { title: row.title as string, description: (row.description as string) ?? '', scheduledAt: (row.scheduledAt as string) ?? '', visibility: (row.visibility as string) ?? 'published' };
  modalOpen.value = true;
}

async function saveSession(): Promise<void> {
  if (editTarget.value) {
    await store.update(editTarget.value.id as string, form.value);
    ui.addToast({ tone: 'success', title: 'Session updated' });
  } else {
    await store.create(form.value);
    ui.addToast({ tone: 'success', title: 'Session created' });
  }
  modalOpen.value = false;
}

async function startSession(row: Record<string, unknown>): Promise<void> {
  actionLoading.value = true;
  await store.update(row.id as string, { status: 'live' });
  actionLoading.value = false;
  ui.addToast({ tone: 'success', title: 'Session is now live!' });
}

async function endSession(row: Record<string, unknown>): Promise<void> {
  const ok = await ui.confirm({ title: 'End session', message: 'End this live session?', tone: 'danger', confirmLabel: 'End session' });
  if (!ok) return;
  actionLoading.value = true;
  await store.update(row.id as string, { status: 'ended' });
  actionLoading.value = false;
  ui.addToast({ tone: 'info', title: 'Session ended' });
}

async function deleteSession(row: Record<string, unknown>): Promise<void> {
  const ok = await ui.confirm({ title: 'Delete session', message: `Delete "${row.title}"?`, tone: 'danger', confirmLabel: 'Delete' });
  if (!ok) return;
  await store.remove(row.id as string);
  ui.addToast({ tone: 'success', title: 'Session deleted' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

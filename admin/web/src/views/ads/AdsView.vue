<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-bold text-ink">Ad campaigns</h2>
      <AppButton size="sm" @click="openCreate">
        <template #icon-left><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg></template>
        New campaign
      </AppButton>
    </div>

    <AppCard>
      <AppTable :columns="columns" :rows="store.campaigns as Record<string, unknown>[]" :loading="store.isLoading">
        <template #cell-status="{ value }">
          <StatusBadge :status="String(value)" />
        </template>
        <template #cell-startsAt="{ value }">
          <span class="text-xs text-ink-muted">{{ value ? formatDate(String(value)) : '—' }}</span>
        </template>
        <template #cell-endsAt="{ value }">
          <span class="text-xs text-ink-muted">{{ value ? formatDate(String(value)) : '—' }}</span>
        </template>
        <template #actions="{ row }">
          <AppButton size="xs" variant="ghost" @click="openEdit(row)">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </AppButton>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create/Edit modal -->
    <AppModal v-model="modalOpen" :title="editTarget ? 'Edit campaign' : 'New campaign'" size="lg">
      <div class="space-y-4">
        <AppInput v-model="form.name" label="Campaign name" required />
        <div class="grid grid-cols-2 gap-4">
          <AppSelect v-model="form.placement" label="Placement" :options="placementOptions" />
          <AppSelect v-model="form.status" label="Status" :options="adStatusOptions" />
        </div>

        <!-- AI Copy Generator -->
        <div class="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-primary-soft uppercase tracking-wide">AI copy generator</p>
            <AppButton variant="secondary" size="xs" :loading="store.isGenerating" @click="generateCopy">
              ✦ Generate
            </AppButton>
          </div>
          <AppInput v-model="aiPrompt" placeholder="Describe your campaign (e.g. 'Easter Sunday worship event')" />
        </div>

        <AppInput v-model="form.headline" label="Headline" required placeholder="Short, punchy headline" />
        <AppTextarea v-model="form.body" label="Body copy" :rows="3" required placeholder="Ad body text…" />
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.startsAt" label="Starts at" type="datetime-local" />
          <AppInput v-model="form.endsAt" label="Ends at" type="datetime-local" />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="modalOpen = false">Cancel</AppButton>
          <AppButton size="sm" :loading="store.isSaving" @click="saveCampaign">Save</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdsStore } from '@/stores/ads.store';
import { useUiStore } from '@/stores/ui.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';

const store = useAdsStore();
const ui = useUiStore();
const modalOpen = ref(false);
const editTarget = ref<Record<string, unknown> | null>(null);
const aiPrompt = ref('');
const form = ref({ name: '', headline: '', body: '', placement: 'feed', status: 'draft', startsAt: '', endsAt: '' });

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'headline', label: 'Headline' },
  { key: 'placement', label: 'Placement' },
  { key: 'status', label: 'Status' },
  { key: 'startsAt', label: 'Starts' },
  { key: 'endsAt', label: 'Ends' },
];

const placementOptions = [
  { value: 'feed', label: 'Feed' },
  { value: 'banner', label: 'Banner' },
  { value: 'interstitial', label: 'Interstitial' },
];

const adStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
];

onMounted(() => { void store.fetchCampaigns(); });

function openCreate(): void {
  editTarget.value = null;
  form.value = { name: '', headline: '', body: '', placement: 'feed', status: 'draft', startsAt: '', endsAt: '' };
  aiPrompt.value = '';
  modalOpen.value = true;
}

function openEdit(row: Record<string, unknown>): void {
  editTarget.value = row;
  form.value = {
    name: row.name as string, headline: row.headline as string, body: row.body as string,
    placement: row.placement as string, status: row.status as string,
    startsAt: (row.startsAt as string) ?? '', endsAt: (row.endsAt as string) ?? '',
  };
  modalOpen.value = true;
}

async function generateCopy(): Promise<void> {
  if (!aiPrompt.value.trim()) {
    ui.addToast({ tone: 'warning', title: 'Enter a prompt first' });
    return;
  }
  const copy = await store.generateCopy(aiPrompt.value);
  form.value.headline = copy.headline;
  form.value.body = copy.body;
  ui.addToast({ tone: 'success', title: 'AI copy generated' });
}

async function saveCampaign(): Promise<void> {
  const input = {
    name: form.value.name, headline: form.value.headline, body: form.value.body,
    placement: form.value.placement, status: form.value.status as 'draft' | 'active' | 'paused' | 'ended',
    startsAt: form.value.startsAt || undefined, endsAt: form.value.endsAt || undefined,
  };
  if (editTarget.value) {
    await store.update(editTarget.value.id as string, input);
    ui.addToast({ tone: 'success', title: 'Campaign updated' });
  } else {
    await store.create(input);
    ui.addToast({ tone: 'success', title: 'Campaign created' });
  }
  modalOpen.value = false;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>

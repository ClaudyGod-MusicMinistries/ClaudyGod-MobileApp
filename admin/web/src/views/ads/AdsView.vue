<template>
  <div class="space-y-5">
    <PageHeader icon="ads" title="Ad campaigns">
      <AppButton size="sm" @click="openCreate">
        <template #icon-left><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg></template>
        New campaign
      </AppButton>
    </PageHeader>

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="store.campaigns as Record<string, unknown>[]" :loading="store.isLoading">
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
      </AppResponsiveTable>
    </AppCard>

    <!-- Create/Edit modal -->
    <AppModal v-model="modalOpen" :title="editTarget ? 'Edit campaign' : 'New campaign'" size="lg">
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput v-model="form.name" label="Campaign name" required />
          <AppInput v-model="form.sponsorName" label="Sponsor name" required placeholder="Who is this ad for?" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppSelect v-model="form.placement" label="Placement" :options="placementOptions" />
          <AppSelect v-model="form.status" label="Status" :options="adStatusOptions" />
        </div>

        <!-- AI Copy Generator -->
        <div class="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-primary-soft uppercase tracking-wide">AI copy generator</p>
            <AppButton variant="secondary" size="xs" :loading="store.isGenerating" @click="generateCopy">
              <template #icon-left>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
              </template>
              Generate
            </AppButton>
          </div>
          <AppInput v-model="aiObjective" placeholder="Describe the objective (e.g. 'Promote Easter Sunday worship event')" />
          <p class="text-[10px] text-ink-muted">Uses the sponsor name and placement above.</p>
        </div>

        <AppInput v-model="form.headline" label="Headline" required placeholder="Short, punchy headline" />
        <AppTextarea v-model="form.body" label="Body copy" :rows="3" required placeholder="Ad body text…" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput v-model="form.ctaLabel" label="CTA label" required placeholder="e.g. Listen now" />
          <AppInput v-model="form.ctaUrl" label="CTA URL" required placeholder="https://…" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
import { AD_STATUS_OPTIONS, AD_CAMPAIGN_PLACEMENT_OPTIONS, type AdCampaignPlacement, type AdStatus } from '@/utils/constants';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import type { AdCampaignInput } from '@/api/types';

const store = useAdsStore();
const ui = useUiStore();
const modalOpen = ref(false);
const editTarget = ref<Record<string, unknown> | null>(null);
const aiObjective = ref('');

interface FormState {
  name: string;
  sponsorName: string;
  headline: string;
  body: string;
  placement: AdCampaignPlacement;
  status: AdStatus;
  ctaLabel: string;
  ctaUrl: string;
  startsAt: string;
  endsAt: string;
}

const emptyForm = (): FormState => ({
  name: '', sponsorName: '', headline: '', body: '',
  placement: 'home', status: 'draft',
  ctaLabel: '', ctaUrl: '', startsAt: '', endsAt: '',
});

const form = ref<FormState>(emptyForm());

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'headline', label: 'Headline' },
  { key: 'placement', label: 'Placement' },
  { key: 'status', label: 'Status' },
  { key: 'startsAt', label: 'Starts' },
  { key: 'endsAt', label: 'Ends' },
];

const placementOptions = AD_CAMPAIGN_PLACEMENT_OPTIONS.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));
const adStatusOptions = AD_STATUS_OPTIONS.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));

// datetime-local inputs use "YYYY-MM-DDTHH:mm" with no timezone; the API needs full ISO 8601.
function toDatetimeLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

onMounted(() => { void store.fetchCampaigns(); });

function openCreate(): void {
  editTarget.value = null;
  form.value = emptyForm();
  aiObjective.value = '';
  modalOpen.value = true;
}

function openEdit(row: Record<string, unknown>): void {
  editTarget.value = row;
  form.value = {
    name: row.name as string,
    sponsorName: row.sponsorName as string,
    headline: row.headline as string,
    body: row.body as string,
    placement: row.placement as AdCampaignPlacement,
    status: row.status as AdStatus,
    ctaLabel: row.ctaLabel as string,
    ctaUrl: row.ctaUrl as string,
    startsAt: toDatetimeLocal(row.startsAt as string | undefined),
    endsAt: toDatetimeLocal(row.endsAt as string | undefined),
  };
  aiObjective.value = '';
  modalOpen.value = true;
}

async function generateCopy(): Promise<void> {
  if (!form.value.sponsorName.trim()) {
    ui.addToast({ tone: 'warning', title: 'Enter a sponsor name first' });
    return;
  }
  if (!aiObjective.value.trim()) {
    ui.addToast({ tone: 'warning', title: 'Describe the objective first' });
    return;
  }
  const copy = await store.generateCopy({
    sponsorName: form.value.sponsorName.trim(),
    placement: form.value.placement,
    objective: aiObjective.value.trim(),
  });
  form.value.headline = copy.headline;
  form.value.body = copy.body;
  ui.addToast({ tone: 'success', title: 'AI copy generated' });
}

async function saveCampaign(): Promise<void> {
  if (!form.value.name.trim() || !form.value.sponsorName.trim() || !form.value.headline.trim()
    || !form.value.body.trim() || !form.value.ctaLabel.trim() || !form.value.ctaUrl.trim()) {
    ui.addToast({ tone: 'danger', title: 'Fill in all required fields' });
    return;
  }

  const input: AdCampaignInput = {
    name: form.value.name.trim(),
    sponsorName: form.value.sponsorName.trim(),
    headline: form.value.headline.trim(),
    body: form.value.body.trim(),
    placement: form.value.placement,
    status: form.value.status,
    ctaLabel: form.value.ctaLabel.trim(),
    ctaUrl: form.value.ctaUrl.trim(),
    startsAt: fromDatetimeLocal(form.value.startsAt),
    endsAt: fromDatetimeLocal(form.value.endsAt),
  };

  try {
    if (editTarget.value) {
      await store.update(editTarget.value.id as string, input);
      ui.addToast({ tone: 'success', title: 'Campaign updated' });
    } else {
      await store.create(input);
      ui.addToast({ tone: 'success', title: 'Campaign created' });
    }
    modalOpen.value = false;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: e instanceof Error ? e.message : 'Failed to save campaign' });
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>

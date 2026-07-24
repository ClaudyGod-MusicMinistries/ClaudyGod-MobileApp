<template>
  <div class="space-y-5">
    <WebPageHeader :icon="CalendarDays" title="Events" subtitle="Tour dates shown on the Events page">
      <AppButton size="sm" @click="openCreate">
        <template #icon><Plus class="w-4 h-4" /></template>
        New event
      </AppButton>
    </WebPageHeader>

    <AppCard class="p-4">
      <div class="flex gap-2 flex-wrap">
        <AppButton
          v-for="s in statusFilters"
          :key="s.value"
          :variant="store.statusFilter === s.value ? 'primary' : 'secondary'"
          size="xs"
          @click="store.setStatusFilter(s.value || undefined)"
        >
          {{ s.label }}
        </AppButton>
      </div>
    </AppCard>

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-title="{ row }">
          <div>
            <p class="text-sm font-medium text-ink">{{ row.title }}</p>
            <p v-if="row.venue" class="text-xs text-ink-muted">{{ row.venue }}</p>
          </div>
        </template>
        <template #cell-startDate="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(value as string) }}</span>
        </template>
        <template #cell-seats="{ row }">
          <span class="text-xs text-ink-muted tabular-nums">{{ row.reservedCount }} / {{ row.totalCapacity }}</span>
        </template>
        <template #cell-status="{ row }">
          <AppSelect
            :model-value="row.status as string"
            :options="statusOptions"
            class="w-36"
            @update:model-value="(v) => changeStatus(row as unknown as EventSummary, v)"
          />
        </template>
        <template #actions="{ row }">
          <AppButton variant="secondary" size="xs" @click="openEdit(row as unknown as EventSummary)">Edit</AppButton>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />

    <AppModal v-model="modalOpen" :title="editingId ? 'Edit event' : 'New event'" size="lg">
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="save">
        <AppInput v-model="form.title" label="Title" required class="sm:col-span-2" />
        <AppTextarea v-model="form.description" label="Description" class="sm:col-span-2" :rows="3" />
        <AppInput v-model="form.venue" label="Venue" />
        <AppInput v-model="form.totalCapacity" type="number" label="Total capacity" required min="1" :hint="capacityHint" />
        <AppInput v-model="form.startDate" type="datetime-local" label="Start" required />
        <AppInput v-model="form.endDate" type="datetime-local" label="End" />
        <div class="flex items-center gap-2.5 pt-6">
          <AppToggle v-model="form.isFree" />
          <span class="text-sm text-ink-soft">Free event</span>
        </div>
        <AppInput v-if="!form.isFree" v-model="form.ticketPrice" type="number" label="Ticket price (USD)" min="0" step="0.01" />

        <p class="sm:col-span-2 text-xs font-semibold text-ink-soft uppercase tracking-wide -mb-2 mt-2">Location (optional)</p>
        <AppInput v-model="form.addressLine1" label="Address" class="sm:col-span-2" />
        <AppInput v-model="form.city" label="City" />
        <AppInput v-model="form.state" label="State" />
        <AppInput v-model="form.country" label="Country" />
        <AppInput v-model="form.zipCode" label="Zip code" />
      </form>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="modalOpen = false">Cancel</AppButton>
          <AppButton size="sm" :loading="saving" @click="save">
            {{ editingId ? 'Save changes' : 'Create event' }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { CalendarDays, Plus } from 'lucide-vue-next';
import { useEventsStore } from '@/stores/website/events.store';
import { useUiStore } from '@/stores/ui.store';
import type { EventSummary, EventInput } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useEventsStore();
const ui = useUiStore();

onMounted(() => { void store.fetchEvents(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'title', label: 'Event' },
  { key: 'startDate', label: 'Date' },
  { key: 'seats', label: 'Reserved / Capacity', align: 'right' as const },
  { key: 'status', label: 'Status' },
];

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Postponed', label: 'Postponed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const statusOptions = statusFilters.slice(1);

async function changeStatus(event: EventSummary, status: string | number): Promise<void> {
  try {
    await store.changeStatus(event.id, String(status));
    ui.addToast({ tone: 'success', title: 'Status updated' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Status update failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const editingReservedCount = ref(0);
const saving = ref(false);

interface EventFormState {
  title: string;
  description: string;
  venue: string;
  totalCapacity: string;
  startDate: string;
  endDate: string;
  isFree: boolean;
  ticketPrice: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

const emptyForm = (): EventFormState => ({
  title: '',
  description: '',
  venue: '',
  totalCapacity: '',
  startDate: '',
  endDate: '',
  isFree: true,
  ticketPrice: '',
  addressLine1: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
});

const form = reactive<EventFormState>(emptyForm());

const capacityHint = computed(() =>
  editingId.value ? `${editingReservedCount.value} seats already reserved` : undefined,
);

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function openCreate(): void {
  editingId.value = null;
  editingReservedCount.value = 0;
  Object.assign(form, emptyForm());
  modalOpen.value = true;
}

async function openEdit(event: EventSummary): Promise<void> {
  try {
    const detail = await store.fetchEventDetail(event.id);
    editingId.value = detail.id;
    editingReservedCount.value = detail.reservedCount;
    Object.assign(form, {
      title: detail.title,
      description: detail.description ?? '',
      venue: detail.venue ?? '',
      totalCapacity: String(detail.totalCapacity),
      startDate: toDatetimeLocal(detail.startDate),
      endDate: toDatetimeLocal(detail.endDate),
      isFree: detail.isFree,
      ticketPrice: detail.ticketPrice != null ? String(detail.ticketPrice) : '',
      addressLine1: '',
      city: detail.locationCity ?? '',
      state: detail.locationState ?? '',
      country: detail.locationCountry ?? '',
      zipCode: '',
    });
    modalOpen.value = true;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to load event', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

async function save(): Promise<void> {
  if (!form.title.trim() || !form.startDate || !form.totalCapacity) {
    ui.addToast({ tone: 'danger', title: 'Title, start date, and capacity are required' });
    return;
  }
  const startIso = fromDatetimeLocal(form.startDate);
  if (!startIso) {
    ui.addToast({ tone: 'danger', title: 'Invalid start date' });
    return;
  }
  saving.value = true;
  try {
    const payload: EventInput = {
      title: form.title,
      description: form.description || null,
      venue: form.venue || null,
      startDate: startIso,
      endDate: fromDatetimeLocal(form.endDate),
      totalCapacity: Number(form.totalCapacity) || 0,
      isFree: form.isFree,
      ticketPrice: form.isFree ? null : Number(form.ticketPrice) || null,
      addressLine1: form.addressLine1 || null,
      city: form.city || null,
      state: form.state || null,
      country: form.country || null,
      zipCode: form.zipCode || null,
    };
    await store.saveEvent(payload, editingId.value ?? undefined);
    ui.addToast({ tone: 'success', title: editingId.value ? 'Event updated' : 'Event created' });
    modalOpen.value = false;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Save failed', message: e instanceof Error ? e.message : 'Please try again' });
  } finally {
    saving.value = false;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

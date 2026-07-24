<template>
  <div class="space-y-5">
    <WebPageHeader :icon="ClipboardList" title="Bookings" subtitle="Booking requests submitted through the Bookings page" />

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
        <template #cell-name="{ row }">
          <div>
            <p class="text-sm font-medium text-ink">{{ row.firstName }} {{ row.lastName }}</p>
            <p class="text-xs text-ink-muted">{{ row.email }}</p>
          </div>
        </template>
        <template #cell-eventType="{ row }">
          <div>
            <p class="text-sm text-ink-soft">{{ row.eventType }}</p>
            <p class="text-xs text-ink-muted">{{ row.organization }}</p>
          </div>
        </template>
        <template #cell-eventDate="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(value as string) }}</span>
        </template>
        <template #cell-status="{ row }">
          <AppSelect
            :model-value="row.status as string"
            :options="statusOptions"
            class="w-36"
            @update:model-value="(v) => changeStatus(row as unknown as Booking, v)"
          />
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton variant="secondary" size="xs" @click="openDetail(row as unknown as Booking)">View</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmTrash(row as unknown as Booking)">Move to trash</AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />

    <AppModal v-model="detailOpen" title="Booking request" size="md">
      <div v-if="selected" class="space-y-3 text-sm">
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Contact</p>
          <p class="text-ink">{{ selected.firstName }} {{ selected.lastName }} — {{ selected.email }} — {{ selected.phone }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Organization</p>
          <p class="text-ink">{{ selected.organization }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Event</p>
          <p class="text-ink">{{ selected.eventType }} — {{ formatDate(selected.eventDate) }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Details</p>
          <p class="text-ink-soft whitespace-pre-wrap">{{ selected.eventDetails }}</p>
        </div>
        <div v-if="selected.adminNotes">
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Admin notes</p>
          <p class="text-ink-soft whitespace-pre-wrap">{{ selected.adminNotes }}</p>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ClipboardList } from 'lucide-vue-next';
import { useBookingsStore } from '@/stores/website/bookings.store';
import { useUiStore } from '@/stores/ui.store';
import type { Booking } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useBookingsStore();
const ui = useUiStore();

onMounted(() => { void store.fetchBookings(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'name', label: 'Contact' },
  { key: 'eventType', label: 'Event' },
  { key: 'eventDate', label: 'Date', align: 'right' as const },
  { key: 'status', label: 'Status' },
];

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'UnderReview', label: 'Under review' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Declined', label: 'Declined' },
  { value: 'Cancelled', label: 'Cancelled' },
];
const statusOptions = statusFilters.slice(1);

async function changeStatus(booking: Booking, status: string | number): Promise<void> {
  try {
    await store.changeStatus(booking.id, String(status));
    ui.addToast({ tone: 'success', title: 'Status updated' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Status update failed', message: e instanceof Error ? e.message : 'Please try again' });
    return;
  }

  // Status change always applies above — this only offers the *optional*
  // extra step of also moving it to Trash. Canceling here never undoes the
  // status change that already happened.
  if (String(status) === 'Declined') {
    const alsoTrash = await ui.confirm({
      title: 'Move to trash?',
      message: `Booking for "${booking.firstName} ${booking.lastName}" was declined. Move it to Trash as well? You can restore it anytime within 30 days.`,
      confirmLabel: 'Move to trash',
      cancelLabel: 'Keep in Bookings',
      tone: 'danger',
    });
    if (alsoTrash) {
      try {
        await store.removeBooking(booking.id);
        ui.addToast({ tone: 'success', title: 'Moved to trash' });
      } catch (e) {
        ui.addToast({ tone: 'danger', title: 'Move to trash failed', message: e instanceof Error ? e.message : 'Please try again' });
      }
    }
  }
}

async function confirmTrash(booking: Booking): Promise<void> {
  const ok = await ui.confirm({
    title: 'Move to trash',
    message: `Move the booking from "${booking.firstName} ${booking.lastName}" to Trash? You can restore it anytime within 30 days.`,
    confirmLabel: 'Move to trash',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeBooking(booking.id);
    ui.addToast({ tone: 'success', title: 'Moved to trash' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Move to trash failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

const detailOpen = ref(false);
const selected = ref<Booking | null>(null);

function openDetail(booking: Booking): void {
  selected.value = booking;
  detailOpen.value = true;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

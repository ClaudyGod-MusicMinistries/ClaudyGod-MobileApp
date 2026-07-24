<template>
  <div class="space-y-5">
    <WebPageHeader :icon="Ticket" title="Tickets" subtitle="Reservations made against events" />

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-attendee="{ row }">
          <div>
            <p class="text-sm font-medium text-ink">{{ row.attendeeFirstName }} {{ row.attendeeLastName }}</p>
            <p class="text-xs text-ink-muted">{{ row.attendeeEmail }}</p>
          </div>
        </template>
        <template #cell-eventTitle="{ value }">
          <span class="text-sm text-ink-soft">{{ value }}</span>
        </template>
        <template #cell-confirmationCode="{ value }">
          <span class="text-xs font-mono text-ink-muted">{{ value }}</span>
        </template>
        <template #cell-status="{ value }">
          <AppBadge :tone="value === 'CheckedIn' ? 'success' : 'neutral'">{{ value }}</AppBadge>
        </template>
        <template #cell-quantity="{ value }">
          <span class="text-xs text-ink-muted tabular-nums">{{ value }}</span>
        </template>
        <template #actions="{ row }">
          <AppButton variant="danger" size="xs" @click="confirmTrash(row as unknown as TicketType)">Move to trash</AppButton>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Ticket } from 'lucide-vue-next';
import { useTicketsStore } from '@/stores/website/tickets.store';
import { useUiStore } from '@/stores/ui.store';
import type { Ticket as TicketType } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useTicketsStore();
const ui = useUiStore();

onMounted(() => { void store.fetchTickets(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'attendee', label: 'Attendee' },
  { key: 'eventTitle', label: 'Event' },
  { key: 'confirmationCode', label: 'Code' },
  { key: 'quantity', label: 'Qty', align: 'right' as const },
  { key: 'status', label: 'Status' },
];

async function confirmTrash(ticket: TicketType): Promise<void> {
  const ok = await ui.confirm({
    title: 'Move to trash',
    message: `Move the reservation for "${ticket.attendeeFirstName} ${ticket.attendeeLastName}" to Trash? You can restore it anytime within 30 days.`,
    confirmLabel: 'Move to trash',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeTicket(ticket.id);
    ui.addToast({ tone: 'success', title: 'Moved to trash' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Move to trash failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}
</script>

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
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Ticket } from 'lucide-vue-next';
import { useTicketsStore } from '@/stores/website/tickets.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useTicketsStore();

onMounted(() => { void store.fetchTickets(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'attendee', label: 'Attendee' },
  { key: 'eventTitle', label: 'Event' },
  { key: 'confirmationCode', label: 'Code' },
  { key: 'quantity', label: 'Qty', align: 'right' as const },
  { key: 'status', label: 'Status' },
];
</script>

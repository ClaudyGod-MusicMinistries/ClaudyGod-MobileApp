<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-bold text-ink">Content requests</h2>
      <div class="flex gap-2">
        <AppButton
          v-for="tab in tabs"
          :key="tab.value"
          :variant="activeTab === tab.value ? 'primary' : 'secondary'"
          size="sm"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </AppButton>
      </div>
    </div>

    <AppCard>
      <AppTable
        :columns="columns"
        :rows="filteredRequests as Record<string, unknown>[]"
        :loading="store.requestsLoading"
      >
        <template #cell-status="{ value }">
          <StatusBadge :status="String(value)" />
        </template>
        <template #cell-type="{ value }">
          <AppBadge tone="neutral">{{ value }}</AppBadge>
        </template>
        <template #cell-requestedBy="{ value }">
          <span class="text-xs text-ink-soft">{{ getEmail(value) }}</span>
        </template>
        <template #cell-createdAt="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(String(value)) }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center gap-1 justify-end">
            <AppButton
              v-if="row.status === 'submitted' || row.status === 'in_review'"
              size="xs"
              variant="secondary"
              class="text-success"
              @click="approve(row)"
            >
              Approve
            </AppButton>
            <AppButton
              v-if="row.status !== 'rejected' && row.status !== 'fulfilled'"
              size="xs"
              variant="ghost"
              class="text-danger"
              @click="openReject(row)"
            >
              Reject
            </AppButton>
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Reject modal -->
    <AppModal v-model="rejectModal" title="Reject request" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-ink-soft">Optionally add a note explaining why this request is being rejected.</p>
        <AppTextarea v-model="rejectReason" label="Reason (optional)" placeholder="Explain the rejection…" :rows="3" />
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="rejectModal = false">Cancel</AppButton>
          <AppButton variant="danger" size="sm" :loading="actionLoading" @click="confirmReject">Reject</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useContentStore } from '@/stores/content.store';
import { useUiStore } from '@/stores/ui.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';

const store = useContentStore();
const ui = useUiStore();

const activeTab = ref('pending');
const rejectModal = ref(false);
const rejectReason = ref('');
const rejectTarget = ref<Record<string, unknown> | null>(null);
const actionLoading = ref(false);

const tabs = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'requestedBy', label: 'Requested by' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Date', align: 'right' as const },
];

const filteredRequests = computed(() => {
  const statusMap: Record<string, string[]> = {
    pending: ['submitted', 'in_review', 'changes_requested'],
    approved: ['approved', 'fulfilled'],
    rejected: ['rejected'],
  };
  return store.requests.filter((r) => statusMap[activeTab.value]?.includes(r.status));
});

onMounted(() => { void store.fetchRequests(); });

async function approve(row: Record<string, unknown>): Promise<void> {
  actionLoading.value = true;
  try {
    await store.updateRequest(row.id as string, 'approved');
    ui.addToast({ tone: 'success', title: 'Request approved' });
  } finally {
    actionLoading.value = false;
  }
}

function openReject(row: Record<string, unknown>): void {
  rejectTarget.value = row;
  rejectReason.value = '';
  rejectModal.value = true;
}

async function confirmReject(): Promise<void> {
  if (!rejectTarget.value) return;
  actionLoading.value = true;
  try {
    await store.updateRequest(rejectTarget.value.id as string, 'rejected', rejectReason.value || undefined);
    ui.addToast({ tone: 'info', title: 'Request rejected' });
    rejectModal.value = false;
  } finally {
    actionLoading.value = false;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getEmail(v: unknown): string {
  return ((v as Record<string, string>).email) ?? '';
}
</script>

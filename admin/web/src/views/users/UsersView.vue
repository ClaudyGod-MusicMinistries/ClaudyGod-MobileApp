<template>
  <div class="space-y-5">
    <h2 class="text-base font-bold text-ink">User management</h2>

    <!-- Tabs -->
    <div class="flex gap-2">
      <AppButton v-for="tab in tabs" :key="tab.id" :variant="activeTab === tab.id ? 'primary' : 'secondary'" size="sm" @click="activeTab = tab.id">
        {{ tab.label }}
      </AppButton>
    </div>

    <!-- Users tab -->
    <template v-if="activeTab === 'users'">
      <AppCard class="p-4">
        <SearchInput v-model="store.userFilters.search" placeholder="Search by name or email…" @update:model-value="void store.fetchUsers()" />
      </AppCard>

      <AppCard>
        <AppResponsiveTable :columns="userCols" :rows="store.users as Record<string, unknown>[]" :loading="store.isLoading">
          <template #cell-displayName="{ row }">
            <div class="flex items-center gap-2.5">
              <UserAvatar :name="(row.displayName as string) ?? undefined" :email="row.email as string" size="sm" />
              <div>
                <p class="text-sm font-medium text-ink">{{ row.displayName || '—' }}</p>
                <p class="text-xs text-ink-muted">{{ row.email }}</p>
              </div>
            </div>
          </template>
          <template #cell-role="{ row }">
            <AppSelect
              :model-value="row.role as string"
              :options="roleOptions"
              class="w-36"
              @update:model-value="confirmRoleChange(row, $event as AssignableRoleValue)"
            />
          </template>
          <template #cell-isVerified="{ value }">
            <AppBadge :tone="value ? 'success' : 'neutral'">{{ value ? 'Verified' : 'Unverified' }}</AppBadge>
          </template>
          <template #cell-createdAt="{ value }">
            <span class="text-xs text-ink-muted">{{ formatDate(String(value)) }}</span>
          </template>
        </AppResponsiveTable>
      </AppCard>

      <AppPagination :page="store.userFilters.page ?? 1" :page-size="store.userFilters.pageSize ?? 25" :total="store.usersTotal" @change="(p) => { store.userFilters.page = p; void store.fetchUsers(); }" />
    </template>

    <!-- Support requests tab -->
    <template v-if="activeTab === 'support'">
      <div class="flex gap-2">
        <AppButton v-for="s in supportStatuses" :key="s" :variant="supportFilter === s ? 'primary' : 'secondary'" size="xs" @click="supportFilter = s; void store.fetchSupportRequests(s || undefined)">
          {{ s || 'All' }}
        </AppButton>
      </div>
      <AppCard>
        <AppResponsiveTable :columns="supportCols" :rows="store.supportRequests as Record<string, unknown>[]" :loading="store.supportLoading">
          <template #cell-user="{ value }">
            <span class="text-xs text-ink-soft">{{ getEmail(value) }}</span>
          </template>
          <template #cell-status="{ value }">
            <StatusBadge :status="String(value)" />
          </template>
          <template #cell-createdAt="{ value }">
            <span class="text-xs text-ink-muted">{{ formatDate(String(value)) }}</span>
          </template>
          <template #actions="{ row }">
            <AppSelect
              :model-value="String(row.status)"
              :options="supportStatusOptions"
              class="w-32"
              @update:model-value="void store.updateSupportStatus(row.id as string, $event)"
            />
          </template>
        </AppResponsiveTable>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUsersStore } from '@/stores/users.store';
import { useUiStore } from '@/stores/ui.store';
import { ASSIGNABLE_ROLE_OPTIONS, ROLE_LABELS, roleRank } from '@/utils/constants';
import type { AssignableRoleValue } from '@/utils/constants';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import SearchInput from '@/components/shared/SearchInput.vue';
import UserAvatar from '@/components/shared/UserAvatar.vue';

const store = useUsersStore();
const ui = useUiStore();
const activeTab = ref('users');
const supportFilter = ref('');

const tabs = [
  { id: 'users', label: 'Users' },
  { id: 'support', label: 'Support requests' },
];
const supportStatuses = ['', 'open', 'in_progress', 'resolved', 'closed'];

const userCols = [
  { key: 'displayName', label: 'User' },
  { key: 'role', label: 'Role' },
  { key: 'isVerified', label: 'Verified' },
  { key: 'createdAt', label: 'Joined', align: 'right' as const },
];

const supportCols = [
  { key: 'subject', label: 'Subject' },
  { key: 'user', label: 'User' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Date', align: 'right' as const },
];

const roleOptions = ASSIGNABLE_ROLE_OPTIONS;
const supportStatusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

onMounted(() => {
  void store.fetchUsers();
  void store.fetchSupportRequests();
});

async function confirmRoleChange(row: Record<string, unknown>, role: AssignableRoleValue): Promise<void> {
  const id = row.id as string;
  if (!id) {
    ui.addToast({ tone: 'danger', title: 'Invalid user ID' });
    return;
  }
  const label = ROLE_LABELS[roleRank(role)];
  const ok = await ui.confirm({
    title: 'Change role',
    message: `Change ${row.email}'s role to ${label}?`,
    confirmLabel: 'Change role',
  });
  if (!ok) return;
  try {
    await store.changeRole(id, role);
    ui.addToast({ tone: 'success', title: 'Role updated' });
  } catch (e) {
    ui.addToast({
      tone: 'danger',
      title: 'Role update failed',
      message: e instanceof Error ? e.message : 'Please try again',
    });
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getEmail(v: unknown): string {
  return ((v as Record<string, string>).email) ?? '';
}
</script>

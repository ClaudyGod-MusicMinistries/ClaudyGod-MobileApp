import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import {
  listUsers,
  updateUserRole,
  listSupportRequests,
  updateSupportRequestStatus,
} from '@/api/users';
import type { UserRecord, SupportRequest } from '@/api/types';

export const useUsersStore = defineStore('users', () => {
  const users = ref<UserRecord[]>([]);
  const usersTotal = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const userFilters = reactive({ search: '', role: undefined as number | undefined, page: 1, pageSize: 25 });

  const supportRequests = ref<SupportRequest[]>([]);
  const supportTotal = ref(0);
  const supportLoading = ref(false);

  async function fetchUsers(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await listUsers(userFilters);
      users.value = res.items;
      usersTotal.value = res.total;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load users';
    } finally {
      isLoading.value = false;
    }
  }

  async function changeRole(userId: string, role: number): Promise<void> {
    const updated = await updateUserRole(userId, role);
    users.value = users.value.map((u) => (u.id === userId ? updated : u));
  }

  async function fetchSupportRequests(status?: string): Promise<void> {
    supportLoading.value = true;
    try {
      const res = await listSupportRequests({ status, pageSize: 50 });
      supportRequests.value = res.items;
      supportTotal.value = res.total;
    } finally {
      supportLoading.value = false;
    }
  }

  async function updateSupportStatus(id: string, status: string): Promise<void> {
    const updated = await updateSupportRequestStatus(id, status);
    supportRequests.value = supportRequests.value.map((r) => (r.id === id ? updated : r));
  }

  return {
    users, usersTotal, isLoading, error, userFilters,
    supportRequests, supportTotal, supportLoading,
    fetchUsers, changeRole, fetchSupportRequests, updateSupportStatus,
  };
});

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listContacts, deleteContact } from '@/api/website';
import type { ContactMessage } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const useContactsStore = defineStore('websiteContacts', () => {
  const items = ref<ContactMessage[]>([]);
  const total = ref(0);
  const page = ref(1);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchContacts(): Promise<void> {
    await execute(
      () => listContacts({ page: page.value, pageSize: PAGE_SIZE }),
      (result) => { items.value = result.items; total.value = result.totalCount; },
    );
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchContacts();
  }

  async function removeContact(id: string): Promise<void> {
    await deleteContact(id);
    await fetchContacts();
  }

  return { items, total, page, isLoading, error, pageSize: PAGE_SIZE, fetchContacts, setPage, removeContact };
});

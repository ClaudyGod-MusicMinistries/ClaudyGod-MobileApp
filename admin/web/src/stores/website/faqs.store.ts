import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listFaqs, createFaq, updateFaq, deleteFaq } from '@/api/website';
import type { Faq, FaqInput } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

export const useFaqsStore = defineStore('websiteFaqs', () => {
  const faqs = ref<Faq[]>([]);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchFaqs(): Promise<void> {
    await execute(() => listFaqs(), (result) => { faqs.value = result; });
  }

  async function saveFaq(input: FaqInput, id?: string): Promise<void> {
    if (id) {
      await updateFaq(id, input);
    } else {
      await createFaq(input);
    }
    await fetchFaqs();
  }

  async function removeFaq(id: string): Promise<void> {
    await deleteFaq(id);
    faqs.value = faqs.value.filter((f) => f.id !== id);
  }

  return { faqs, isLoading, error, fetchFaqs, saveFaq, removeFaq };
});

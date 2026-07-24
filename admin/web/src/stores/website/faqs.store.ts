import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listFaqs, createFaq, updateFaq, deleteFaq } from '@/api/website';
import type { Faq, FaqInput } from '@/api/websiteTypes';

export const useFaqsStore = defineStore('websiteFaqs', () => {
  const faqs = ref<Faq[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchFaqs(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      faqs.value = await listFaqs();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load FAQs';
    } finally {
      isLoading.value = false;
    }
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

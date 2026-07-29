import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  getAppConfig,
  updateAppConfig,
  listWordsOfDay,
  createWordOfDay,
  updateWordOfDayById,
  deleteWordOfDay,
} from '@/api/config';
import type { AppConfig, WordOfDay, WordOfDayInput } from '@/api/types';

export const useConfigStore = defineStore('config', () => {
  const appConfig = ref<AppConfig | null>(null);
  const wordSchedule = ref<WordOfDay[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  async function fetchAppConfig(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      appConfig.value = await getAppConfig();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load config';
    } finally {
      isLoading.value = false;
    }
  }

  async function saveAppConfig(config: AppConfig): Promise<void> {
    isSaving.value = true;
    try {
      appConfig.value = await updateAppConfig(config);
    } finally {
      isSaving.value = false;
    }
  }

  async function fetchWordSchedule(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      wordSchedule.value = await listWordsOfDay();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load schedule';
      wordSchedule.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function addWordEntry(input: WordOfDayInput): Promise<WordOfDay> {
    const created = await createWordOfDay(input);
    wordSchedule.value = [...wordSchedule.value, created].sort(
      (a, b) => new Date(a.messageDate).getTime() - new Date(b.messageDate).getTime(),
    );
    return created;
  }

  async function editWordEntry(id: string, input: WordOfDayInput): Promise<WordOfDay> {
    const updated = await updateWordOfDayById(id, input);
    wordSchedule.value = wordSchedule.value
      .map((w) => (w.id === id ? updated : w))
      .sort((a, b) => new Date(a.messageDate).getTime() - new Date(b.messageDate).getTime());
    return updated;
  }

  async function removeWordEntry(id: string): Promise<void> {
    await deleteWordOfDay(id);
    wordSchedule.value = wordSchedule.value.filter((w) => w.id !== id);
  }

  return {
    appConfig, wordSchedule,
    isLoading, isSaving, error,
    fetchAppConfig, saveAppConfig,
    fetchWordSchedule, addWordEntry, editWordEntry, removeWordEntry,
  };
});

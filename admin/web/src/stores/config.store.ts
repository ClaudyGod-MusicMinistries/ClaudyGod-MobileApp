import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getAppConfig, updateAppConfig, getWordOfDay, updateWordOfDay } from '@/api/config';
import type { AppConfig, WordOfDay } from '@/api/types';

export const useConfigStore = defineStore('config', () => {
  const appConfig = ref<AppConfig | null>(null);
  const wordOfDay = ref<WordOfDay | null>(null);
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

  async function fetchWordOfDay(): Promise<void> {
    isLoading.value = true;
    try {
      wordOfDay.value = await getWordOfDay();
    } finally {
      isLoading.value = false;
    }
  }

  async function saveWordOfDay(input: WordOfDay): Promise<void> {
    isSaving.value = true;
    try {
      wordOfDay.value = await updateWordOfDay(input);
    } finally {
      isSaving.value = false;
    }
  }

  return { appConfig, wordOfDay, isLoading, isSaving, error, fetchAppConfig, saveAppConfig, fetchWordOfDay, saveWordOfDay };
});

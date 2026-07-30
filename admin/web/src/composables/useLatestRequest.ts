import { ref } from 'vue';
import { getErrorMessage } from '@/api/apiError';

/** Coordinates replaceable reads so only the newest request can commit state. */
export function useLatestRequest() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let generation = 0;

  async function execute<T>(load: () => Promise<T>, commit: (value: T) => void): Promise<boolean> {
    const current = ++generation;
    isLoading.value = true;
    error.value = null;
    try {
      const value = await load();
      if (current !== generation) return false;
      commit(value);
      return true;
    } catch (cause) {
      if (current === generation) error.value = getErrorMessage(cause);
      return false;
    } finally {
      if (current === generation) isLoading.value = false;
    }
  }

  function invalidate(): void {
    generation += 1;
    isLoading.value = false;
  }

  return { isLoading, error, execute, invalidate };
}

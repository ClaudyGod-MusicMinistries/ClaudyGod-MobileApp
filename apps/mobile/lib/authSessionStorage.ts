import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const createMemoryStorage = () => {
  const memory = new Map<string, string>();
  return {
    async getItem(key: string): Promise<string | null> { return memory.get(key) ?? null; },
    async setItem(key: string, value: string): Promise<void> { memory.set(key, value); },
    async removeItem(key: string): Promise<void> { memory.delete(key); },
  };
};

// Web uses memory-only storage — tokens must never touch browser localStorage.
// Native uses AsyncStorage (app-sandboxed) so sessions survive restarts.
const memoryStorage = createMemoryStorage();

export const authSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return memoryStorage.getItem(key);
    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) { await memoryStorage.setItem(key, value); return; }
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb) { await memoryStorage.removeItem(key); return; }
    await AsyncStorage.removeItem(key);
  },

  async restoreSession(): Promise<{ accessToken?: string; refreshToken?: string }> {
    const key = 'claudygod.mobile-auth-session.v1';
    const raw = await this.getItem(key);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as { accessToken?: string | null; refreshToken?: string | null };
      return {
        accessToken: parsed.accessToken ?? undefined,
        refreshToken: parsed.refreshToken ?? undefined,
      };
    } catch {
      await this.removeItem(key);
      return {};
    }
  },
};

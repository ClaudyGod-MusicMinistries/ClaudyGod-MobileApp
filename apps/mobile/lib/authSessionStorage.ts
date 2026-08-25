import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
// Native session credentials live in the platform keystore. AsyncStorage is
// read once only to migrate sessions created by older app builds.
const memoryStorage = createMemoryStorage();

export const authSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return memoryStorage.getItem(key);
    const secure = await SecureStore.getItemAsync(key);
    if (secure) return secure;
    const legacy = await AsyncStorage.getItem(key);
    if (legacy) {
      await SecureStore.setItemAsync(key, legacy, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
      await AsyncStorage.removeItem(key);
    }
    return legacy;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) { await memoryStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    await AsyncStorage.removeItem(key).catch(() => undefined);
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb) { await memoryStorage.removeItem(key); return; }
    await Promise.all([SecureStore.deleteItemAsync(key), AsyncStorage.removeItem(key)]);
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

import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

interface BrowserStorageLike {
  getItem: (_key: string) => string | null;
  setItem: (_key: string, _value: string) => void;
  removeItem: (_key: string) => void;
}

interface AuthSession {
  accessToken?: string;
  refreshToken?: string;
}

const createMemoryStorage = () => {
  const memory = new Map<string, string>();

  return {
    async getItem(key: string): Promise<string | null> {
      return memory.has(key) ? memory.get(key) ?? null : null;
    },
    async setItem(key: string, value: string): Promise<void> {
      memory.set(key, value);
    },
    async removeItem(key: string): Promise<void> {
      memory.delete(key);
    },
  };
};

const memoryStorage = createMemoryStorage();

const getBrowserWindow = (): {
  sessionStorage?: BrowserStorageLike;
  localStorage?: BrowserStorageLike;
} | null => {
  if (!isWeb || typeof globalThis === 'undefined') {
    return null;
  }

  try {
    return (globalThis as typeof globalThis & {
      window?: {
        sessionStorage?: BrowserStorageLike;
        localStorage?: BrowserStorageLike;
      };
    }).window ?? null;
  } catch {
    return null;
  }
};

const getWebSessionStorage = (): BrowserStorageLike | null => getBrowserWindow()?.sessionStorage ?? null;

const getWebLocalStorage = (): BrowserStorageLike | null => getBrowserWindow()?.localStorage ?? null;

export const authSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const sessionStorage = getWebSessionStorage();
    if (sessionStorage) {
      const currentValue = sessionStorage.getItem(key);
      if (currentValue !== null) {
        return currentValue;
      }

      const legacyStorage = getWebLocalStorage();
      const legacyValue = legacyStorage?.getItem(key) ?? null;
      if (legacyValue !== null) {
        sessionStorage.setItem(key, legacyValue);
        legacyStorage?.removeItem(key);
        return legacyValue;
      }

      return null;
    }

    // Mobile: never persist auth tokens locally.
    if (!isWeb) {
      return memoryStorage.getItem(key);
    }

    return memoryStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const sessionStorage = getWebSessionStorage();
    if (sessionStorage) {
      sessionStorage.setItem(key, value);
      getWebLocalStorage()?.removeItem(key);
      return;
    }

    // Mobile: in-memory only.
    if (!isWeb) {
      await memoryStorage.setItem(key, value);
      return;
    }

    await memoryStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    const sessionStorage = getWebSessionStorage();
    if (sessionStorage) {
      sessionStorage.removeItem(key);
      getWebLocalStorage()?.removeItem(key);
      return;
    }

    // Mobile: in-memory only.
    if (!isWeb) {
      await memoryStorage.removeItem(key);
      return;
    }

    await memoryStorage.removeItem(key);
  },

  async restoreSession(): Promise<AuthSession> {
    const key = 'claudygod.mobile-auth-session.v1';
    const storedSession = await this.getItem(key);
    
    if (!storedSession) {
      return {};
    }

    try {
      const parsed = JSON.parse(storedSession) as {
        accessToken?: string | null;
        refreshToken?: string | null;
      };
      return {
        accessToken: parsed.accessToken ?? undefined,
        refreshToken: parsed.refreshToken ?? undefined,
      };
    } catch {
      // Fallback: try old individual keys if JSON parsing fails
      const accessToken = await this.getItem('accessToken');
      const refreshToken = await this.getItem('refreshToken');
      
      return {
        accessToken: accessToken ?? undefined,
        refreshToken: refreshToken ?? undefined,
      };
    }
  },
};

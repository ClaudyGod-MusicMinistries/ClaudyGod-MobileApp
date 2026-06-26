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

const clearBrowserTokenCopies = (key: string): void => {
  if (!isWeb) {
    return;
  }

  try {
    getWebSessionStorage()?.removeItem(key);
    getWebLocalStorage()?.removeItem(key);
  } catch {
    // Browser storage can be unavailable; auth remains memory-only.
  }
};

export const authSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    clearBrowserTokenCopies(key);
    return memoryStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    clearBrowserTokenCopies(key);
    await memoryStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    clearBrowserTokenCopies(key);
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
      await this.removeItem('accessToken');
      await this.removeItem('refreshToken');
      return {};
    }
  },
};

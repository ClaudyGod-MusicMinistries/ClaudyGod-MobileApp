import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { ENV } from '../services/config';
import { CLIENT_VERSION } from '../config/constants';

const SESSION_KEY = 'claudygod.installation-session.v2';
const LEGACY_DEVICE_ID_KEY = 'claudygod.device.id';

export type InstallationSession = { installationId: string; credential: string };
let memorySession: InstallationSession | null = null;
let cachedSession: InstallationSession | null | undefined;
let ongoingRegistration: Promise<InstallationSession> | null = null;

function getWebItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

function setWebItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // localStorage unavailable
  }
}

function removeWebItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // localStorage unavailable
  }
}

export async function getInstallationSession(): Promise<InstallationSession | null> {
  if (cachedSession !== undefined) return cachedSession;
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = memorySession ? JSON.stringify(memorySession) : getWebItem(SESSION_KEY);
    } else {
      raw = await SecureStore.getItemAsync(SESSION_KEY);
    }
    if (!raw) return (cachedSession = null);
    const parsed = JSON.parse(raw) as InstallationSession;
    if (!parsed.installationId || !parsed.credential) throw new Error('Invalid installation session');
    memorySession = parsed;
    return (cachedSession = parsed);
  } catch {
    await clearInstallationSession();
    return null;
  }
}

export async function saveInstallationSession(session: InstallationSession): Promise<void> {
  cachedSession = session;
  memorySession = session;
  const serialized = JSON.stringify(session);
  if (Platform.OS === 'web') {
    setWebItem(SESSION_KEY, serialized);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, serialized, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await AsyncStorage.removeItem(LEGACY_DEVICE_ID_KEY).catch(() => undefined);
}

export async function clearInstallationSession(): Promise<void> {
  cachedSession = null;
  memorySession = null;
  ongoingRegistration = null;
  if (Platform.OS === 'web') {
    removeWebItem(SESSION_KEY);
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => undefined);
  }
}

/**
 * Ensures an installation session exists. If one is not present in storage,
 * registers a new installation via single-flight promise deduplication so
 * concurrent requests on app launch never trigger multiple registrations.
 */
export async function ensureInstallationSession(): Promise<InstallationSession> {
  const existing = await getInstallationSession();
  if (existing) return existing;
  if (ongoingRegistration) return ongoingRegistration;

  ongoingRegistration = (async () => {
    try {
      const platform = Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web'
        ? Platform.OS
        : 'unknown';
      const appVersion = Constants.expoConfig?.version ?? undefined;

      const response = await fetch(`${ENV.apiUrl}/v1/mobile/installations/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Claudy-Client-Platform': Platform.OS,
          'X-Claudy-Client-Version': CLIENT_VERSION,
        },
        body: JSON.stringify({ platform, appVersion }),
      });

      if (!response.ok) {
        throw new Error(`Installation registration failed: HTTP ${response.status}`);
      }

      const result = (await response.json()) as {
        installation: { id: string };
        credential: string;
      };

      const session: InstallationSession = {
        installationId: result.installation.id,
        credential: result.credential,
      };

      await saveInstallationSession(session);
      return session;
    } finally {
      ongoingRegistration = null;
    }
  })();

  return ongoingRegistration;
}

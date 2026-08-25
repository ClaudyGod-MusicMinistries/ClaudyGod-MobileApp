import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'claudygod.installation-session.v2';
const LEGACY_DEVICE_ID_KEY = 'claudygod.device.id';

export type InstallationSession = { installationId: string; credential: string };
let memorySession: InstallationSession | null = null;
let cachedSession: InstallationSession | null | undefined;

export async function getInstallationSession(): Promise<InstallationSession | null> {
  if (cachedSession !== undefined) return cachedSession;
  const raw = Platform.OS === 'web' ? (memorySession ? JSON.stringify(memorySession) : null) : await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return (cachedSession = null);
  try {
    const parsed = JSON.parse(raw) as InstallationSession;
    if (!parsed.installationId || !parsed.credential) throw new Error('Invalid installation session');
    return (cachedSession = parsed);
  } catch {
    await clearInstallationSession();
    return null;
  }
}

export async function saveInstallationSession(session: InstallationSession): Promise<void> {
  cachedSession = session;
  if (Platform.OS === 'web') { memorySession = session; return; }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  await AsyncStorage.removeItem(LEGACY_DEVICE_ID_KEY).catch(() => undefined);
}

export async function clearInstallationSession(): Promise<void> {
  cachedSession = null;
  memorySession = null;
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(SESSION_KEY);
}

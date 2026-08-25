import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEY = 'claudygod.guest-support.credentials.v1';
export type GuestSupportCredential = { id: string; trackingToken: string };
type StoredSupportState = { contactEmail: string; tickets: GuestSupportCredential[] };
const EMPTY: StoredSupportState = { contactEmail: '', tickets: [] };

export async function getGuestSupportState(): Promise<StoredSupportState> {
  try {
    const value = await SecureStore.getItemAsync(KEY);
    if (value) return JSON.parse(value) as StoredSupportState;
  } catch { /* web or unavailable keystore falls through to device storage */ }
  try { const value = await AsyncStorage.getItem(KEY); return value ? JSON.parse(value) as StoredSupportState : EMPTY; } catch { return EMPTY; }
}

export async function saveGuestSupportState(state: StoredSupportState): Promise<void> {
  const normalized = { contactEmail: state.contactEmail, tickets: state.tickets.slice(0, 10) };
  const value = JSON.stringify(normalized);
  try {
    await SecureStore.setItemAsync(KEY, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    await AsyncStorage.removeItem(KEY).catch(() => undefined);
    return;
  } catch { await AsyncStorage.setItem(KEY, value); }
}

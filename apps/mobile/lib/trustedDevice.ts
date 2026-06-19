/**
 * Trusted device management.
 * Stores a long-lived token in SecureStore. This token is exchanged for a full
 * JWT session — but only after the user passes a local biometric check.
 * The biometric gate lives entirely on the device; the server just validates the token.
 */
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const SECURE_KEY = 'claudygod.trusted_device.v1';

interface StoredTrustedDevice {
  token: string;
  deviceLabel: string;
  expiresAt: string;
}

export function isTrustedDeviceSupported(): boolean {
  return Platform.OS !== 'web';
}

export async function getBiometricType(): Promise<'face' | 'fingerprint' | 'none'> {
  if (!isTrustedDeviceSupported()) return 'none';
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    return 'none';
  } catch {
    return 'none';
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isTrustedDeviceSupported()) return false;
  try {
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return has && enrolled;
  } catch {
    return false;
  }
}

export async function promptBiometric(reason: string): Promise<boolean> {
  if (!isTrustedDeviceSupported()) return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function storeTrustedDeviceToken(
  token: string,
  deviceLabel: string,
  expiresAt: string,
): Promise<void> {
  const payload: StoredTrustedDevice = { token, deviceLabel, expiresAt };
  await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(payload), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getTrustedDeviceToken(): Promise<StoredTrustedDevice | null> {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredTrustedDevice;
    if (!parsed.token || !parsed.expiresAt) return null;
    if (new Date(parsed.expiresAt) < new Date()) {
      await clearTrustedDeviceToken();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearTrustedDeviceToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEY);
  } catch { /* ignore */ }
}

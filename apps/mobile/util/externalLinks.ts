import { Linking } from 'react-native';

const ALLOWED_SCHEMES = new Set(['https:', 'mailto:', 'tel:']);

export async function openExternalUrl(rawUrl: string): Promise<boolean> {
  const value = rawUrl.trim();
  if (!value) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (!ALLOWED_SCHEMES.has(parsed.protocol.toLowerCase())) return false;
  try {
    if (!(await Linking.canOpenURL(value))) return false;
    await Linking.openURL(value);
    return true;
  } catch {
    return false;
  }
}

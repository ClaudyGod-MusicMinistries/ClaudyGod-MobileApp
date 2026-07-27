import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeedCardItem } from '../services/contentService';

const KEYS = {
  favorites:   'claudygod.user.favorites',
  history:     'claudygod.user.history',
  preferences: 'claudygod.user.preferences',
  downloads:   'claudygod.user.downloads',
} as const;

const MAX_FAVORITES = 200;
const MAX_HISTORY   = 100;

// ── Helpers ────────────────────────────────────────────────────────────────

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

let storageMutationQueue: Promise<void> = Promise.resolve();

async function updateJSON<T>(key: string, fallback: T, update: (_current: T) => T): Promise<T> {
  let result = fallback;
  const operation = async () => {
    const current = await readJSON<T>(key, fallback);
    result = update(current);
    await writeJSON(key, result);
  };
  storageMutationQueue = storageMutationQueue.then(operation, operation);
  await storageMutationQueue;
  return result;
}

// ── Favourites ─────────────────────────────────────────────────────────────

export async function getFavorites(): Promise<FeedCardItem[]> {
  return readJSON<FeedCardItem[]>(KEYS.favorites, []);
}

export async function addFavorite(item: FeedCardItem): Promise<void> {
  await updateJSON<FeedCardItem[]>(KEYS.favorites, [], (current) => current.some((entry) => entry.id === item.id)
    ? current
    : [item, ...current].slice(0, MAX_FAVORITES));
}

export async function removeFavorite(contentId: string): Promise<void> {
  await updateJSON<FeedCardItem[]>(KEYS.favorites, [], (current) => current.filter((entry) => entry.id !== contentId));
}

export async function isFavorited(contentId: string): Promise<boolean> {
  const current = await getFavorites();
  return current.some((f) => f.id === contentId);
}

// ── History ────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<FeedCardItem[]> {
  return readJSON<FeedCardItem[]>(KEYS.history, []);
}

export async function addHistory(item: FeedCardItem): Promise<void> {
  await updateJSON<FeedCardItem[]>(KEYS.history, [], (current) => [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, MAX_HISTORY));
}

// ── Preferences ────────────────────────────────────────────────────────────

export async function getPreference<T>(key: string, fallback: T): Promise<T> {
  const prefs = await readJSON<Record<string, unknown>>(KEYS.preferences, {});
  return (key in prefs ? prefs[key] : fallback) as T;
}

export async function setPreference(key: string, value: unknown): Promise<void> {
  await updateJSON<Record<string, unknown>>(KEYS.preferences, {}, (current) => ({ ...current, [key]: value }));
}

// Guards the one-time "push local guest favorites up to the server" migration
// (see UserAccountContext.tsx) so it doesn't re-run on every app launch once
// it's already succeeded for this device.
const FAVORITES_MIGRATION_KEY = 'favoritesMigratedToServer';

export async function hasMigratedFavoritesToServer(): Promise<boolean> {
  return getPreference<boolean>(FAVORITES_MIGRATION_KEY, false);
}

export async function markFavoritesMigratedToServer(): Promise<void> {
  await setPreference(FAVORITES_MIGRATION_KEY, true);
}

// Guards the one-time "replay local guest history up to the server" migration
// (see UserAccountContext.tsx), mirroring the favorites guard above.
const HISTORY_MIGRATION_KEY = 'historyMigratedToServer';

export async function hasMigratedHistoryToServer(): Promise<boolean> {
  return getPreference<boolean>(HISTORY_MIGRATION_KEY, false);
}

export async function markHistoryMigratedToServer(): Promise<void> {
  await setPreference(HISTORY_MIGRATION_KEY, true);
}

// ── Downloads ──────────────────────────────────────────────────────────────

export interface LocalDownload {
  contentId: string;
  title: string;
  localUri: string;
  contentType: string;
  imageUrl?: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  savedAt: string;
}

export async function getDownloads(): Promise<LocalDownload[]> {
  return readJSON<LocalDownload[]>(KEYS.downloads, []);
}

export async function saveDownload(download: LocalDownload): Promise<void> {
  await updateJSON<LocalDownload[]>(KEYS.downloads, [], (current) => [
    download,
    ...current.filter((entry) => entry.contentId !== download.contentId),
  ]);
}

export async function removeDownload(contentId: string): Promise<void> {
  await updateJSON<LocalDownload[]>(KEYS.downloads, [], (current) => current.filter((entry) => entry.contentId !== contentId));
}

// ── Clear all ──────────────────────────────────────────────────────────────

export async function clearAllLocalData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

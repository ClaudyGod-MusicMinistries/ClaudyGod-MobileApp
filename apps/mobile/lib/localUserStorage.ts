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
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage quota or unavailable — best-effort */ }
}

// ── Favourites ─────────────────────────────────────────────────────────────

export async function getFavorites(): Promise<FeedCardItem[]> {
  return readJSON<FeedCardItem[]>(KEYS.favorites, []);
}

export async function addFavorite(item: FeedCardItem): Promise<void> {
  const current = await getFavorites();
  if (current.some((f) => f.id === item.id)) return;
  const updated = [item, ...current].slice(0, MAX_FAVORITES);
  await writeJSON(KEYS.favorites, updated);
}

export async function removeFavorite(contentId: string): Promise<void> {
  const current = await getFavorites();
  await writeJSON(KEYS.favorites, current.filter((f) => f.id !== contentId));
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
  const current = await getHistory();
  const updated = [item, ...current.filter((h) => h.id !== item.id)].slice(0, MAX_HISTORY);
  await writeJSON(KEYS.history, updated);
}

// ── Preferences ────────────────────────────────────────────────────────────

export async function getPreference<T>(key: string, fallback: T): Promise<T> {
  const prefs = await readJSON<Record<string, unknown>>(KEYS.preferences, {});
  return (key in prefs ? prefs[key] : fallback) as T;
}

export async function setPreference(key: string, value: unknown): Promise<void> {
  const prefs = await readJSON<Record<string, unknown>>(KEYS.preferences, {});
  await writeJSON(KEYS.preferences, { ...prefs, [key]: value });
}

// ── Downloads ──────────────────────────────────────────────────────────────

export interface LocalDownload {
  contentId: string;
  title: string;
  localUri: string;
  contentType: string;
  imageUrl?: string;
  savedAt: string;
}

export async function getDownloads(): Promise<LocalDownload[]> {
  return readJSON<LocalDownload[]>(KEYS.downloads, []);
}

export async function saveDownload(download: LocalDownload): Promise<void> {
  const current = await getDownloads();
  const updated = [
    download,
    ...current.filter((d) => d.contentId !== download.contentId),
  ];
  await writeJSON(KEYS.downloads, updated);
}

export async function removeDownload(contentId: string): Promise<void> {
  const current = await getDownloads();
  await writeJSON(KEYS.downloads, current.filter((d) => d.contentId !== contentId));
}

// ── Clear all ──────────────────────────────────────────────────────────────

export async function clearAllLocalData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch { /* best-effort */ }
}

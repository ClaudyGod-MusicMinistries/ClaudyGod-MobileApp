import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeedCardItem } from '../services/contentService';

const KEYS = {
  favorites:   'claudygod.guest.favorites',
  history:     'claudygod.guest.history',
  preferences: 'claudygod.guest.preferences',
  downloads:   'claudygod.guest.downloads',
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

export async function getGuestFavorites(): Promise<FeedCardItem[]> {
  return readJSON<FeedCardItem[]>(KEYS.favorites, []);
}

export async function addGuestFavorite(item: FeedCardItem): Promise<void> {
  const current = await getGuestFavorites();
  if (current.some((f) => f.id === item.id)) return;
  const updated = [item, ...current].slice(0, MAX_FAVORITES);
  await writeJSON(KEYS.favorites, updated);
}

export async function removeGuestFavorite(contentId: string): Promise<void> {
  const current = await getGuestFavorites();
  await writeJSON(KEYS.favorites, current.filter((f) => f.id !== contentId));
}

export async function isGuestFavorited(contentId: string): Promise<boolean> {
  const current = await getGuestFavorites();
  return current.some((f) => f.id === contentId);
}

// ── History ────────────────────────────────────────────────────────────────

export async function getGuestHistory(): Promise<FeedCardItem[]> {
  return readJSON<FeedCardItem[]>(KEYS.history, []);
}

export async function addGuestHistory(item: FeedCardItem): Promise<void> {
  const current = await getGuestHistory();
  // Remove existing entry then prepend (most-recent first), cap at MAX_HISTORY
  const updated = [item, ...current.filter((h) => h.id !== item.id)].slice(0, MAX_HISTORY);
  await writeJSON(KEYS.history, updated);
}

// ── Preferences ────────────────────────────────────────────────────────────

export async function getGuestPreference<T>(key: string, fallback: T): Promise<T> {
  const prefs = await readJSON<Record<string, unknown>>(KEYS.preferences, {});
  return (key in prefs ? prefs[key] : fallback) as T;
}

export async function setGuestPreference(key: string, value: unknown): Promise<void> {
  const prefs = await readJSON<Record<string, unknown>>(KEYS.preferences, {});
  await writeJSON(KEYS.preferences, { ...prefs, [key]: value });
}

// ── Downloads ──────────────────────────────────────────────────────────────

export interface GuestDownload {
  contentId: string;
  title: string;
  localUri: string;
  contentType: string;
  imageUrl?: string;
  savedAt: string;
}

export async function getGuestDownloads(): Promise<GuestDownload[]> {
  return readJSON<GuestDownload[]>(KEYS.downloads, []);
}

export async function saveGuestDownload(download: GuestDownload): Promise<void> {
  const current = await getGuestDownloads();
  const updated = [
    download,
    ...current.filter((d) => d.contentId !== download.contentId),
  ];
  await writeJSON(KEYS.downloads, updated);
}

export async function removeGuestDownload(contentId: string): Promise<void> {
  const current = await getGuestDownloads();
  await writeJSON(KEYS.downloads, current.filter((d) => d.contentId !== contentId));
}

// ── Sync export ────────────────────────────────────────────────────────────

export async function exportForAccountSync(): Promise<{
  favorites: FeedCardItem[];
  historyIds: string[];
}> {
  const [favorites, history] = await Promise.all([getGuestFavorites(), getGuestHistory()]);
  return { favorites, historyIds: history.map((h) => h.id) };
}

export async function clearAllGuestData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch { /* best-effort */ }
}

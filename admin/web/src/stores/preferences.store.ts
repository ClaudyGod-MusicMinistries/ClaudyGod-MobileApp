import { defineStore } from 'pinia';
import { ref } from 'vue';
import { THEME_STORAGE_KEY, TOUR_SEEN_STORAGE_KEY } from '@/utils/constants';

export type Theme = 'light' | 'dark';

function readStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

function readSystemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readTourSeen(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(TOUR_SEEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function applyThemeClass(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// No backend-synced preferences exist yet (no per-user settings API) — theme and
// tour progress are local-only, same pattern already used for the mobile preview
// URL override. Call `init()` once, before the app mounts, to avoid a flash of the
// wrong theme on load.
export const usePreferencesStore = defineStore('preferences', () => {
  const theme = ref<Theme>(readStoredTheme() ?? readSystemTheme());
  const tourSeen = ref<Record<string, boolean>>(readTourSeen());

  function init(): void {
    applyThemeClass(theme.value);
  }

  function setTheme(next: Theme): void {
    theme.value = next;
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyThemeClass(next);
  }

  function toggleTheme(): void {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  }

  function persistTourSeen(): void {
    localStorage.setItem(TOUR_SEEN_STORAGE_KEY, JSON.stringify(tourSeen.value));
  }

  function markTourSeen(tourId: string): void {
    tourSeen.value = { ...tourSeen.value, [tourId]: true };
    persistTourSeen();
  }

  function resetTour(tourId: string): void {
    const next = { ...tourSeen.value };
    delete next[tourId];
    tourSeen.value = next;
    persistTourSeen();
  }

  function hasSeenTour(tourId: string): boolean {
    return !!tourSeen.value[tourId];
  }

  return { theme, tourSeen, init, setTheme, toggleTheme, markTourSeen, resetTour, hasSeenTour };
});

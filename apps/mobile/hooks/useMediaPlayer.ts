/**
 * The legacy media-player context was removed when playback moved to route-driven screens.
 * This hook remains as a guarded stub so stale imports fail clearly instead of breaking build resolution.
 */
export type MediaPlayerContextType = never;

export function useMediaPlayer(): never {
  throw new Error('useMediaPlayer is unavailable in the current mobile build.');
}

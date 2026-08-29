/**
 * Playback domain types — Phase 1 of the platform plan.
 *
 * This module is intentionally free of React and of react-native-track-player.
 * `queue.ts` is a pure reducer over `QueueState`; the RNTP-aware service and the
 * Zustand store are thin layers added on top once the queue semantics are locked.
 * Nothing imports this module yet — it is inert until the service is wired.
 */

export type RepeatMode = 'off' | 'context' | 'one';

export type PlaybackEngine = 'native' | 'youtube';

/** Where the audio bytes come from. `youtube` is played by the WebView engine, not RNTP. */
export type PlaybackSource =
  | { kind: 'stream'; uri: string }
  | { kind: 'download'; uri: string }
  | { kind: 'youtube'; videoId: string };

export interface PlaybackItem {
  /** Stable content id (today: `FeedCardItem.id`; after Phase 2: `track.id`). */
  id: string;
  title: string;
  artist?: string;
  artworkUrl?: string;
  durationMs?: number;
  source: PlaybackSource;
}

export type QueueOriginKind = 'playlist' | 'album' | 'feed-rail' | 'search' | 'single';

export interface QueueOrigin {
  kind: QueueOriginKind;
  /** Playlist/album/rail id; `null` for ad-hoc single plays. */
  id: string | null;
  /** Human label shown in the player ("Worship Essentials", "From Search"). */
  label: string;
}

/**
 * The whole queue. Two independent lanes feed the now-playing slot:
 *
 *  - the **context** — the album / playlist / rail the user pressed play on,
 *    played in `shuffleOrder` when shuffling and natural order otherwise;
 *  - the **user queue** — tracks explicitly inserted with "play next" /
 *    "add to queue", always consumed before the context resumes.
 */
export interface QueueState {
  origin: QueueOrigin;
  contextItems: PlaybackItem[];
  /**
   * Position within the *active ordering* of the context (see `activeOrder`).
   * `-1` when there is no context. Only meaningful while
   * `nowPlayingSource === 'context'`, but kept in sync so the context resumes
   * from the right place after user-queued tracks finish.
   */
  contextCursor: number;
  /** Permutation of `contextItems` indices; `null` when shuffle is off. */
  shuffleOrder: number[] | null;
  /** FIFO of "play next" (unshift) / "add to queue" (push) items. */
  userQueue: PlaybackItem[];
  /** What actually played, oldest first, capped at `HISTORY_LIMIT`. */
  history: PlaybackItem[];
  nowPlaying: PlaybackItem | null;
  nowPlayingSource: 'context' | 'user' | null;
  repeat: RepeatMode;
  shuffle: boolean;
}

export const HISTORY_LIMIT = 100;

export interface AdvanceResult {
  state: QueueState;
  /** True when there was nothing left to play (end of context, repeat off). */
  ended: boolean;
  /** True when `repeat: 'one'` held the current track (auto-advance only). */
  looped: boolean;
}

/** Deterministic-in-tests RNG hook: returns a float in [0, 1). */
export type Rng = () => number;

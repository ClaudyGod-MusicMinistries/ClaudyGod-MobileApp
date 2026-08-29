/**
 * Pure queue reducer for the playback service (Phase 1).
 *
 * Every function is `(state, ...args) => state` (or a small result object) with
 * no side effects, so the queue semantics can be unit-tested with zero mocks.
 * See `queue.test.ts` and §4 of the Playback Service Spec.
 */

import {
  type AdvanceResult,
  type PlaybackItem,
  type QueueOrigin,
  type QueueState,
  type RepeatMode,
  type Rng,
  HISTORY_LIMIT,
} from './types';

const EMPTY_ORIGIN: QueueOrigin = { kind: 'single', id: null, label: '' };

export function createQueue(): QueueState {
  return {
    origin: EMPTY_ORIGIN,
    contextItems: [],
    contextCursor: -1,
    shuffleOrder: null,
    userQueue: [],
    history: [],
    nowPlaying: null,
    nowPlayingSource: null,
    repeat: 'off',
    shuffle: false,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** The order context items are played in right now: shuffle permutation or natural. */
export function activeOrder(state: QueueState): number[] {
  return state.shuffleOrder ?? range(state.contextItems.length);
}

/** The context item at the current cursor, or `null`. */
export function currentContextItem(state: QueueState): PlaybackItem | null {
  const order = activeOrder(state);
  if (state.contextCursor < 0 || state.contextCursor >= order.length) return null;
  return state.contextItems[order[state.contextCursor]] ?? null;
}

const pushHistory = (history: PlaybackItem[], item: PlaybackItem | null): PlaybackItem[] => {
  if (!item) return history;
  const next = [...history, item];
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
};

/** Fisher–Yates over a copy, with `first` pinned at position 0 when in range. */
function shuffledIndices(count: number, first: number, rng: Rng): number[] {
  const rest = range(count).filter((i) => i !== first);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return first >= 0 && first < count ? [first, ...rest] : rest;
}

// ─── starting playback ────────────────────────────────────────────────────────

export interface PlayFromInput {
  origin: QueueOrigin;
  items: PlaybackItem[];
  /** Id of the item to start on; falls back to the first item. */
  startId?: string;
}

export function playFrom(state: QueueState, input: PlayFromInput, rng: Rng = Math.random): QueueState {
  const { origin, items, startId } = input;

  if (items.length === 0) {
    return {
      ...state,
      origin,
      contextItems: [],
      contextCursor: -1,
      shuffleOrder: null,
      userQueue: [],
      nowPlaying: null,
      nowPlayingSource: null,
    };
  }

  const startIndex = Math.max(0, startId ? items.findIndex((i) => i.id === startId) : 0);
  const resolvedStart = startIndex === -1 ? 0 : startIndex;

  const shuffleOrder = state.shuffle ? shuffledIndices(items.length, resolvedStart, rng) : null;
  const contextCursor = state.shuffle ? 0 : resolvedStart;

  return {
    ...state,
    origin,
    contextItems: items,
    contextCursor,
    shuffleOrder,
    userQueue: [],
    nowPlaying: items[resolvedStart],
    nowPlayingSource: 'context',
  };
}

// ─── user queue ───────────────────────────────────────────────────────────────

export function playNext(state: QueueState, item: PlaybackItem): QueueState {
  return { ...state, userQueue: [item, ...state.userQueue.filter((q) => q.id !== item.id)] };
}

export function addToQueue(state: QueueState, item: PlaybackItem): QueueState {
  return { ...state, userQueue: [...state.userQueue.filter((q) => q.id !== item.id), item] };
}

export function removeFromUserQueue(state: QueueState, id: string): QueueState {
  return { ...state, userQueue: state.userQueue.filter((q) => q.id !== id) };
}

export function reorderUserQueue(state: QueueState, from: number, to: number): QueueState {
  const list = state.userQueue;
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return state;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return { ...state, userQueue: next };
}

// ─── advancing ────────────────────────────────────────────────────────────────

/** Resolve what plays next without mutating — used for next-track pre-buffer. */
export function peekNext(
  state: QueueState,
  reason: 'auto' | 'user' = 'auto',
): PlaybackItem | null {
  if (reason === 'auto' && state.repeat === 'one' && state.nowPlaying) {
    return state.nowPlaying;
  }
  if (state.userQueue.length > 0) return state.userQueue[0];

  const order = activeOrder(state);
  if (order.length === 0) return null;

  const nextCursor = state.contextCursor + 1;
  if (nextCursor < order.length) return state.contextItems[order[nextCursor]] ?? null;
  if (state.repeat === 'context') return state.contextItems[order[0]] ?? null;
  return null;
}

/**
 * Move to the next track.
 * @param reason `'auto'` = the current track ended; `'user'` = the user pressed skip
 *   (which overrides `repeat: 'one'`).
 */
export function advance(state: QueueState, reason: 'auto' | 'user' = 'auto'): AdvanceResult {
  if (reason === 'auto' && state.repeat === 'one' && state.nowPlaying) {
    return { state, ended: false, looped: true };
  }

  // 1. user queue wins
  if (state.userQueue.length > 0) {
    const [next, ...rest] = state.userQueue;
    return {
      state: {
        ...state,
        history: pushHistory(state.history, state.nowPlaying),
        userQueue: rest,
        nowPlaying: next,
        nowPlayingSource: 'user',
      },
      ended: false,
      looped: false,
    };
  }

  // 2. context
  const order = activeOrder(state);
  if (order.length > 0) {
    let nextCursor = state.contextCursor + 1;
    if (nextCursor >= order.length) {
      if (state.repeat === 'context') {
        nextCursor = 0;
      } else {
        return { state, ended: true, looped: false };
      }
    }
    return {
      state: {
        ...state,
        history: pushHistory(state.history, state.nowPlaying),
        contextCursor: nextCursor,
        nowPlaying: state.contextItems[order[nextCursor]],
        nowPlayingSource: 'context',
      },
      ended: false,
      looped: false,
    };
  }

  // 3. nothing to play
  return { state, ended: true, looped: false };
}

export interface PreviousResult {
  state: QueueState;
  /** False when there was no history to step back to (caller may restart the track). */
  changed: boolean;
}

/**
 * Step back. The caller is responsible for the "seek to 0 if position > 3s"
 * rule — this only handles the history walk.
 */
export function previous(state: QueueState): PreviousResult {
  if (state.history.length === 0) return { state, changed: false };

  const prev = state.history[state.history.length - 1];
  const history = state.history.slice(0, -1);

  const cursor =
    state.nowPlayingSource === 'context' && state.contextCursor > 0
      ? state.contextCursor - 1
      : state.contextCursor;

  const order = activeOrder(state);
  const cursorItem = cursor >= 0 && cursor < order.length ? state.contextItems[order[cursor]] : null;
  const nowPlayingSource: QueueState['nowPlayingSource'] =
    cursorItem && cursorItem.id === prev.id ? 'context' : 'user';

  return {
    state: {
      ...state,
      history,
      contextCursor: nowPlayingSource === 'context' ? cursor : state.contextCursor,
      nowPlaying: prev,
      nowPlayingSource,
    },
    changed: true,
  };
}

/** Play a specific item that is already in the queue (tapping an up-next row). */
export function jumpTo(state: QueueState, id: string): QueueState {
  const userIndex = state.userQueue.findIndex((q) => q.id === id);
  if (userIndex >= 0) {
    const next = state.userQueue[userIndex];
    return {
      ...state,
      history: pushHistory(state.history, state.nowPlaying),
      userQueue: state.userQueue.slice(userIndex + 1),
      nowPlaying: next,
      nowPlayingSource: 'user',
    };
  }

  const order = activeOrder(state);
  const orderPos = order.findIndex((naturalIdx) => state.contextItems[naturalIdx]?.id === id);
  if (orderPos >= 0) {
    return {
      ...state,
      history: pushHistory(state.history, state.nowPlaying),
      contextCursor: orderPos,
      nowPlaying: state.contextItems[order[orderPos]],
      nowPlayingSource: 'context',
    };
  }

  return state;
}

// ─── modes ────────────────────────────────────────────────────────────────────

export function setRepeat(state: QueueState, repeat: RepeatMode): QueueState {
  return { ...state, repeat };
}

export function cycleRepeat(state: QueueState): QueueState {
  const order: RepeatMode[] = ['off', 'context', 'one'];
  return { ...state, repeat: order[(order.indexOf(state.repeat) + 1) % order.length] };
}

export function setShuffle(state: QueueState, shuffle: boolean, rng: Rng = Math.random): QueueState {
  if (shuffle === state.shuffle) return state;
  return shuffle ? enableShuffle(state, rng) : disableShuffle(state);
}

export function toggleShuffle(state: QueueState, rng: Rng = Math.random): QueueState {
  return setShuffle(state, !state.shuffle, rng);
}

function enableShuffle(state: QueueState, rng: Rng): QueueState {
  if (state.contextItems.length === 0) {
    return { ...state, shuffle: true, shuffleOrder: null };
  }
  const pinned =
    state.nowPlayingSource === 'context' && state.contextCursor >= 0
      ? activeOrder(state)[state.contextCursor]
      : 0;
  return {
    ...state,
    shuffle: true,
    shuffleOrder: shuffledIndices(state.contextItems.length, pinned, rng),
    contextCursor: state.contextItems.length > 0 ? 0 : -1,
  };
}

function disableShuffle(state: QueueState): QueueState {
  if (!state.shuffleOrder || state.contextItems.length === 0) {
    return { ...state, shuffle: false, shuffleOrder: null };
  }
  const currentNatural =
    state.nowPlayingSource === 'context'
      ? state.contextItems.findIndex((i) => i.id === state.nowPlaying?.id)
      : state.shuffleOrder[state.contextCursor] ?? 0;
  return {
    ...state,
    shuffle: false,
    shuffleOrder: null,
    contextCursor: currentNatural >= 0 ? currentNatural : 0,
  };
}

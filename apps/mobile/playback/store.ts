/**
 * Playback store — the single source of truth for now-playing, queue, status
 * and progress. Framework-light: a pair of vanilla external stores read through
 * `useSyncExternalStore`, so there is no new dependency and the intent actions
 * stay unit-testable with zero mocks (`store.test.ts`).
 *
 * Two stores on purpose:
 *   - `core`     — status / nowPlaying / queue / engine / error. Changes rarely.
 *   - `progress` — position / duration. Changes ~4×/s while playing.
 * Splitting them keeps a scrubbing progress bar from re-rendering the mini
 * player's title on every tick.
 *
 * The UI calls the intent actions; the `PlaybackEngineBridge` (registered by
 * `service.ts`) does the imperative audio work and reports status back through
 * `reportEngine*`. The UI never touches the engine directly.
 */

import { useSyncExternalStore } from 'react';

import * as queue from './queue';
import type { ResumeTarget } from './remote';
import type { PlaybackItem, QueueOrigin, QueueState, RepeatMode } from './types';

export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'ended'
  | 'error';

export type PlaybackEngineKind = 'native' | 'youtube';

export interface PlaybackCoreState {
  status: PlaybackStatus;
  engine: PlaybackEngineKind;
  nowPlaying: PlaybackItem | null;
  queue: QueueState;
  error: string | null;
  resumeTarget: ResumeTarget | null;
}

export interface PlaybackProgressState {
  positionMs: number;
  durationMs: number;
}

// ─── minimal external store ──────────────────────────────────────────────────

interface Store<T extends object> {
  get(): T;
  set(_patch: Partial<T> | ((_state: T) => Partial<T>)): void;
  subscribe(_listener: () => void): () => void;
}

function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch) => {
      const next = typeof patch === 'function' ? patch(state) : patch;
      const keys = Object.keys(next) as (keyof T)[];
      if (keys.every((key) => next[key] === state[key])) return;
      state = { ...state, ...next };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const core = createStore<PlaybackCoreState>({
  status: 'idle',
  engine: 'native',
  nowPlaying: null,
  queue: queue.createQueue(),
  error: null,
  resumeTarget: null,
});

const progress = createStore<PlaybackProgressState>({ positionMs: 0, durationMs: 0 });

const engineFor = (item: PlaybackItem): PlaybackEngineKind =>
  item.source.kind === 'youtube' ? 'youtube' : 'native';

// ─── engine bridge ───────────────────────────────────────────────────────────

export interface PlaybackEngineBridge {
  load(_item: PlaybackItem, _options: { autoplay: boolean }): void;
  play(): void;
  pause(): void;
  seekTo(_positionMs: number): void;
  stop(): void;
  setLoop(_loop: boolean): void;
  syncMetadata(_item: PlaybackItem | null): void;
}

let engine: PlaybackEngineBridge | null = null;

export function registerPlaybackEngine(bridge: PlaybackEngineBridge | null): void {
  engine = bridge;
}

// Mirrors the user's "autoplay next" preference (settings / music screen). When
// off, a finished track stops instead of advancing; explicit skips still work.
let autoplayEnabled = true;

export function setAutoplayEnabled(value: boolean): void {
  autoplayEnabled = value;
}

// ─── persistence ─────────────────────────────────────────────────────────────

const PERSIST_DEBOUNCE_MS = 1_000;

export interface PersistedSession {
  queue: QueueState;
  nowPlaying: PlaybackItem | null;
  positionMs: number;
}

/**
 * Storage backend, registered by `index.ts` (native) with an AsyncStorage
 * implementation. Left `null` in unit tests so the store never touches disk.
 */
export interface PlaybackPersistence {
  load(): Promise<PersistedSession | null>;
  save(_session: PersistedSession | null): void;
}

let persistence: PlaybackPersistence | null = null;

export function registerPlaybackPersistence(backend: PlaybackPersistence | null): void {
  persistence = backend;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(): void {
  if (!persistence) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const { queue: currentQueue, nowPlaying } = core.get();
    persistence?.save({
      queue: currentQueue,
      nowPlaying,
      positionMs: progress.get().positionMs,
    });
  }, PERSIST_DEBOUNCE_MS);
}

/**
 * Restore the last session into the store as a paused track. The service calls
 * this on launch, then loads the source without autoplay and seeks to
 * `positionMs`. Returns the restored session so the caller can seek.
 */
export async function hydratePlaybackSession(): Promise<PersistedSession | null> {
  const saved = (await persistence?.load()) ?? null;
  if (!saved?.nowPlaying) return null;
  core.set({
    queue: saved.queue,
    nowPlaying: saved.nowPlaying,
    engine: engineFor(saved.nowPlaying),
    status: 'paused',
    error: null,
  });
  progress.set({
    positionMs: Math.max(0, saved.positionMs ?? 0),
    durationMs: saved.nowPlaying.durationMs ?? 0,
  });
  return saved;
}

// ─── intent actions ──────────────────────────────────────────────────────────

function commitQueue(nextQueue: QueueState, options: { autoplay: boolean }): void {
  const nowPlaying = nextQueue.nowPlaying;
  core.set({
    queue: nextQueue,
    nowPlaying,
    engine: nowPlaying ? engineFor(nowPlaying) : 'native',
    status: nowPlaying ? 'loading' : 'idle',
    error: null,
  });
  progress.set({ positionMs: 0, durationMs: nowPlaying?.durationMs ?? 0 });
  if (nowPlaying && nowPlaying.source.kind !== 'youtube') {
    engine?.load(nowPlaying, { autoplay: options.autoplay });
    engine?.syncMetadata(nowPlaying);
  } else if (!nowPlaying) {
    engine?.stop();
    engine?.syncMetadata(null);
  }
  schedulePersist();
}

export interface PlayFromInput {
  origin: QueueOrigin;
  items: PlaybackItem[];
  startId?: string;
}

export function playFrom(input: PlayFromInput): void {
  commitQueue(queue.playFrom(core.get().queue, input), { autoplay: true });
}

export function play(): void {
  const state = core.get();
  if (!state.nowPlaying) return;
  if (state.status === 'ended') engine?.seekTo(0);
  engine?.play();
}

export function pause(): void {
  engine?.pause();
  schedulePersist();
}

export function toggle(): void {
  const { status } = core.get();
  if (status === 'playing' || status === 'buffering' || status === 'loading') pause();
  else play();
}

export function next(reason: 'auto' | 'user' = 'user'): void {
  if (reason === 'auto' && !autoplayEnabled) {
    core.set({ status: 'ended' });
    engine?.pause();
    return;
  }
  const result = queue.advance(core.get().queue, reason);
  if (result.looped) {
    engine?.seekTo(0);
    engine?.play();
    return;
  }
  if (result.ended) {
    core.set({ status: 'ended' });
    engine?.pause();
    return;
  }
  commitQueue(result.state, { autoplay: true });
}

/** "Seek to 0 when more than 3s in" is handled here, not in the reducer. */
export function previous(): void {
  if (progress.get().positionMs > 3_000) {
    engine?.seekTo(0);
    return;
  }
  const result = queue.previous(core.get().queue);
  if (!result.changed) {
    engine?.seekTo(0);
    return;
  }
  commitQueue(result.state, { autoplay: true });
}

export function seekTo(positionMs: number): void {
  const clamped = Math.max(0, positionMs);
  engine?.seekTo(clamped);
  progress.set({ positionMs: clamped });
}

export function playNext(item: PlaybackItem): void {
  core.set(({ queue: current }) => ({ queue: queue.playNext(current, item) }));
  schedulePersist();
}

export function addToQueue(item: PlaybackItem): void {
  core.set(({ queue: current }) => ({ queue: queue.addToQueue(current, item) }));
  schedulePersist();
}

export function removeFromQueue(id: string): void {
  core.set(({ queue: current }) => ({ queue: queue.removeFromUserQueue(current, id) }));
  schedulePersist();
}

export function reorderQueue(from: number, to: number): void {
  core.set(({ queue: current }) => ({ queue: queue.reorderUserQueue(current, from, to) }));
  schedulePersist();
}

export function setRepeat(mode: RepeatMode): void {
  const nextQueue = queue.setRepeat(core.get().queue, mode);
  core.set({ queue: nextQueue });
  engine?.setLoop(nextQueue.repeat === 'one');
  schedulePersist();
}

export function cycleRepeat(): void {
  const nextQueue = queue.cycleRepeat(core.get().queue);
  core.set({ queue: nextQueue });
  engine?.setLoop(nextQueue.repeat === 'one');
  schedulePersist();
}

export function toggleShuffle(): void {
  core.set(({ queue: current }) => ({ queue: queue.toggleShuffle(current) }));
  schedulePersist();
}

export function stop(): void {
  engine?.stop();
  engine?.syncMetadata(null);
  core.set({
    status: 'idle',
    nowPlaying: null,
    queue: queue.createQueue(),
    error: null,
  });
  progress.set({ positionMs: 0, durationMs: 0 });
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = null;
  persistence?.save(null);
}

export function setResumeTarget(target: ResumeTarget | null): void {
  core.set({ resumeTarget: target });
}

export function dismissResumeTarget(): void {
  core.set({ resumeTarget: null });
}

/** Start playing the server-provided resume target at its saved position. */
export function playResumeTarget(): void {
  const target = core.get().resumeTarget;
  if (!target?.mediaUrl) {
    core.set({ resumeTarget: null });
    return;
  }
  const item: PlaybackItem = {
    id: target.id,
    title: target.title,
    artist: target.subtitle || undefined,
    artworkUrl: target.imageUrl || undefined,
    durationMs: target.resumeDurationMs ?? undefined,
    source: { kind: 'stream', uri: target.mediaUrl },
  };
  commitQueue(
    queue.playFrom(core.get().queue, {
      origin: { kind: 'single', id: null, label: 'Resume' },
      items: [item],
    }),
    { autoplay: true },
  );
  if (target.resumePositionMs > 0) seekTo(target.resumePositionMs);
  core.set({ resumeTarget: null });
}

// ─── engine → store ──────────────────────────────────────────────────────────

export interface EngineStatusReport {
  isLoaded: boolean;
  playing: boolean;
  isBuffering: boolean;
  positionMs: number;
  durationMs: number;
}

export function reportEngineStatus(report: EngineStatusReport): void {
  progress.set({
    positionMs: Math.max(0, Math.round(report.positionMs)),
    durationMs:
      report.durationMs > 0 ? Math.round(report.durationMs) : progress.get().durationMs,
  });

  const state = core.get();
  if (!state.nowPlaying || state.status === 'idle' || state.status === 'ended') return;
  if (state.status === 'error') return;

  const nextStatus: PlaybackStatus = !report.isLoaded
    ? 'loading'
    : report.isBuffering
      ? 'buffering'
      : report.playing
        ? 'playing'
        : 'paused';

  if (nextStatus !== state.status) core.set({ status: nextStatus });
}

export function reportEngineFinished(): void {
  next('auto');
}

export function reportEngineError(message: string): void {
  core.set({ status: 'error', error: message });
}

// ─── selectors ───────────────────────────────────────────────────────────────

export function usePlayback(): PlaybackCoreState {
  return useSyncExternalStore(core.subscribe, core.get, core.get);
}

export function usePlaybackProgress(): PlaybackProgressState {
  return useSyncExternalStore(progress.subscribe, progress.get, progress.get);
}

/** True when there is a native track to show in the mini player. */
export function usePlaybackVisible(): boolean {
  const { status, engine: kind } = usePlayback();
  return status !== 'idle' && kind === 'native';
}

// ─── non-hook access (service + tests) ───────────────────────────────────────

export const getPlaybackState = core.get;
export const getPlaybackProgress = progress.get;
export const subscribePlayback = core.subscribe;

/** Test-only: wipe both stores back to their initial values. */
export function __resetPlaybackStoreForTest(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = null;
  engine = null;
  persistence = null;
  autoplayEnabled = true;
  core.set({
    status: 'idle',
    engine: 'native',
    nowPlaying: null,
    queue: queue.createQueue(),
    error: null,
    resumeTarget: null,
  });
  progress.set({ positionMs: 0, durationMs: 0 });
}

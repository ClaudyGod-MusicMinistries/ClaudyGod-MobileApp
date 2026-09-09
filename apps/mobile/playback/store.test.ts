import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as store from './store';
import type { PlaybackItem, QueueOrigin } from './types';

const ORIGIN: QueueOrigin = { kind: 'playlist', id: 'pl', label: 'Worship' };
const track = (id: string): PlaybackItem => ({
  id,
  title: `Track ${id}`,
  source: { kind: 'stream', uri: `https://cdn.example/${id}.mp3` },
});
const ITEMS = ['a', 'b', 'c'].map(track);

const makeEngine = () => ({
  load: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  seekTo: vi.fn(),
  stop: vi.fn(),
  setLoop: vi.fn(),
  syncMetadata: vi.fn(),
});

let engine: ReturnType<typeof makeEngine>;
let saved: store.PersistedSession | null | undefined;

beforeEach(() => {
  store.__resetPlaybackStoreForTest();
  engine = makeEngine();
  store.registerPlaybackEngine(engine);
  saved = undefined;
  store.registerPlaybackPersistence({
    load: async () => saved ?? null,
    save: (session) => {
      saved = session;
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('playFrom', () => {
  it('sets the queue, marks loading, and drives the engine', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS, startId: 'b' });
    const state = store.getPlaybackState();
    expect(state.nowPlaying?.id).toBe('b');
    expect(state.status).toBe('loading');
    expect(state.engine).toBe('native');
    expect(engine.load).toHaveBeenCalledWith(ITEMS[1], { autoplay: true });
    expect(engine.syncMetadata).toHaveBeenCalledWith(ITEMS[1]);
  });
});

describe('toggle / play / pause', () => {
  it('pauses when playing and plays when paused', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    store.reportEngineStatus({ isLoaded: true, playing: true, isBuffering: false, positionMs: 1000, durationMs: 60_000 });
    expect(store.getPlaybackState().status).toBe('playing');

    store.toggle();
    expect(engine.pause).toHaveBeenCalled();

    store.reportEngineStatus({ isLoaded: true, playing: false, isBuffering: false, positionMs: 1000, durationMs: 60_000 });
    store.toggle();
    expect(engine.play).toHaveBeenCalled();
  });
});

describe('next', () => {
  it('advances through the context', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    store.next('user');
    expect(store.getPlaybackState().nowPlaying?.id).toBe('b');
    store.next('user');
    expect(store.getPlaybackState().nowPlaying?.id).toBe('c');
  });

  it('ends at the tail with repeat off', () => {
    store.playFrom({ origin: ORIGIN, items: [track('a')] });
    store.next('user');
    expect(store.getPlaybackState().status).toBe('ended');
    expect(engine.pause).toHaveBeenCalled();
  });
});

describe('previous', () => {
  it('restarts the track when more than 3s in', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS, startId: 'b' });
    store.reportEngineStatus({ isLoaded: true, playing: true, isBuffering: false, positionMs: 8000, durationMs: 60_000 });
    store.previous();
    expect(engine.seekTo).toHaveBeenCalledWith(0);
    expect(store.getPlaybackState().nowPlaying?.id).toBe('b');
  });

  it('steps back in history when near the start', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    store.next('user');
    store.reportEngineStatus({ isLoaded: true, playing: true, isBuffering: false, positionMs: 500, durationMs: 60_000 });
    store.previous();
    expect(store.getPlaybackState().nowPlaying?.id).toBe('a');
  });
});

describe('seekTo', () => {
  it('drives the engine and updates progress optimistically', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    store.seekTo(12_000);
    expect(engine.seekTo).toHaveBeenCalledWith(12_000);
    expect(store.getPlaybackProgress().positionMs).toBe(12_000);
  });
});

describe('engine reports', () => {
  it('maps status to the store status', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    store.reportEngineStatus({ isLoaded: true, playing: false, isBuffering: true, positionMs: 0, durationMs: 0 });
    expect(store.getPlaybackState().status).toBe('buffering');
    store.reportEngineStatus({ isLoaded: true, playing: true, isBuffering: false, positionMs: 100, durationMs: 1000 });
    expect(store.getPlaybackState().status).toBe('playing');
  });

  it('advances on finish', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    store.reportEngineFinished();
    expect(store.getPlaybackState().nowPlaying?.id).toBe('b');
  });

  it('surfaces an error status', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    store.reportEngineError('network down');
    expect(store.getPlaybackState().status).toBe('error');
    expect(store.getPlaybackState().error).toBe('network down');
  });
});

describe('repeat', () => {
  it('turns the engine loop on for repeat one', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    store.setRepeat('one');
    expect(engine.setLoop).toHaveBeenCalledWith(true);
    store.setRepeat('off');
    expect(engine.setLoop).toHaveBeenLastCalledWith(false);
  });
});

describe('stop', () => {
  it('clears everything and wipes the persisted session', () => {
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    store.stop();
    const state = store.getPlaybackState();
    expect(state.status).toBe('idle');
    expect(state.nowPlaying).toBeNull();
    expect(engine.stop).toHaveBeenCalled();
    expect(saved).toBeNull();
  });
});

describe('persistence', () => {
  it('debounces a write of queue + nowPlaying + position', () => {
    vi.useFakeTimers();
    store.playFrom({ origin: ORIGIN, items: ITEMS, startId: 'b' });
    store.seekTo(5000);
    expect(saved).toBeUndefined();
    vi.advanceTimersByTime(1000);
    expect(saved?.nowPlaying?.id).toBe('b');
    expect(saved?.positionMs).toBe(5000);
  });

  it('hydrates a saved session as a paused track', async () => {
    // Capture a real QueueState shape, then hand it back as the saved session.
    store.playFrom({ origin: ORIGIN, items: ITEMS, startId: 'c' });
    const persistedQueue = store.getPlaybackState().queue;
    store.__resetPlaybackStoreForTest();
    store.registerPlaybackPersistence({
      load: async () => ({ queue: persistedQueue, nowPlaying: track('c'), positionMs: 9000 }),
      save: () => undefined,
    });

    const restored = await store.hydratePlaybackSession();
    expect(restored?.nowPlaying?.id).toBe('c');
    expect(store.getPlaybackState().status).toBe('paused');
    expect(store.getPlaybackProgress().positionMs).toBe(9000);
  });
});

describe('resume target', () => {
  it('sets and dismisses', () => {
    store.setResumeTarget({
      id: 'x',
      type: 'audio',
      title: 'T',
      subtitle: '',
      imageUrl: '',
      duration: '3:00',
      resumePositionMs: 1000,
      resumeDurationMs: 180000,
      updatedAt: '',
    });
    expect(store.getPlaybackState().resumeTarget?.id).toBe('x');
    store.dismissResumeTarget();
    expect(store.getPlaybackState().resumeTarget).toBeNull();
  });
});

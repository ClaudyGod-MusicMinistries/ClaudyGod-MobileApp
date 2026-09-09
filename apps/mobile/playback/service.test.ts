import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  handlePlaybackForeground,
  startPlaybackService,
  stopPlaybackService,
  type EnginePlayer,
  type EnginePlayerStatus,
  type PlaybackServiceDeps,
} from './service';
import * as store from './store';
import type { PlaybackItem, QueueOrigin } from './types';

const ORIGIN: QueueOrigin = { kind: 'playlist', id: 'pl', label: 'Worship' };
const track = (id: string): PlaybackItem => ({
  id,
  title: `Track ${id}`,
  source: { kind: 'stream', uri: `https://cdn.example/${id}.mp3` },
});
const ITEMS = ['a', 'b', 'c'].map(track);

function makeFakePlayer() {
  let listener: ((_status: EnginePlayerStatus) => void) | null = null;
  const player: EnginePlayer = {
    loop: false,
    replace: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    seekTo: vi.fn(),
    addListener: vi.fn((_event: 'playbackStatusUpdate', l: (_s: EnginePlayerStatus) => void) => {
      listener = l;
      return { remove: vi.fn() };
    }),
    setActiveForLockScreen: vi.fn(),
    updateLockScreenMetadata: vi.fn(),
    release: vi.fn(),
  } as unknown as EnginePlayer;
  const emit = (partial: Partial<EnginePlayerStatus>) =>
    listener?.({
      playing: false,
      didJustFinish: false,
      isBuffering: false,
      isLoaded: true,
      ...partial,
    });
  return { player, emit };
}

let fake: ReturnType<typeof makeFakePlayer>;
let deps: PlaybackServiceDeps;

beforeEach(() => {
  store.__resetPlaybackStoreForTest();
  fake = makeFakePlayer();
  deps = {
    createPlayer: () => fake.player,
    activateSession: vi.fn(async () => undefined),
    savePosition: vi.fn(async () => undefined),
    fetchResume: vi.fn(async () => null),
    reportBreadcrumb: vi.fn(),
  };
});

afterEach(() => {
  stopPlaybackService();
  vi.useRealTimers();
});

describe('startPlaybackService', () => {
  it('activates the session and subscribes to status', async () => {
    await startPlaybackService(deps);
    expect(deps.activateSession).toHaveBeenCalled();
    expect(fake.player.addListener).toHaveBeenCalledWith('playbackStatusUpdate', expect.any(Function));
  });

  it('is idempotent', async () => {
    await startPlaybackService(deps);
    await startPlaybackService(deps);
    expect(deps.activateSession).toHaveBeenCalledTimes(1);
  });

  it('surfaces a resume target from the server', async () => {
    deps.fetchResume = vi.fn(async () => ({
      id: 'r1',
      type: 'audio',
      title: 'Sermon',
      subtitle: '',
      imageUrl: '',
      duration: '30:00',
      resumePositionMs: 60_000,
      resumeDurationMs: 1_800_000,
      updatedAt: '',
    }));
    await startPlaybackService(deps);
    expect(store.getPlaybackState().resumeTarget?.id).toBe('r1');
  });
});

describe('engine bridge', () => {
  it('loads and plays a new track, and sets lock-screen controls once', async () => {
    await startPlaybackService(deps);
    store.playFrom({ origin: ORIGIN, items: ITEMS });

    expect(fake.player.replace).toHaveBeenCalledWith({ uri: 'https://cdn.example/a.mp3' });
    expect(fake.player.play).toHaveBeenCalled();
    expect(fake.player.setActiveForLockScreen).toHaveBeenCalledTimes(1);

    store.next('user');
    expect(fake.player.updateLockScreenMetadata).toHaveBeenCalled();
    expect(fake.player.setActiveForLockScreen).toHaveBeenCalledTimes(1);
  });

  it('reflects engine status into the store', async () => {
    await startPlaybackService(deps);
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    fake.emit({ playing: true, currentTime: 2, duration: 60 });
    expect(store.getPlaybackState().status).toBe('playing');
    expect(store.getPlaybackProgress().positionMs).toBe(2000);
  });

  it('advances the queue when a track finishes', async () => {
    await startPlaybackService(deps);
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    vi.mocked(fake.player.replace).mockClear();
    fake.emit({ didJustFinish: true, currentTime: 60, duration: 60 });
    expect(store.getPlaybackState().nowPlaying?.id).toBe('b');
    expect(fake.player.replace).toHaveBeenCalledWith({ uri: 'https://cdn.example/b.mp3' });
  });
});

describe('errors', () => {
  it('auto-skips after two consecutive engine errors', async () => {
    await startPlaybackService(deps);
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    fake.emit({ error: 'boom' });
    expect(store.getPlaybackState().status).toBe('error');
    fake.emit({ error: 'boom again' });
    expect(store.getPlaybackState().nowPlaying?.id).toBe('b');
    expect(deps.reportBreadcrumb).toHaveBeenCalledTimes(2);
  });
});

describe('heartbeat', () => {
  it('saves the position on the interval', async () => {
    vi.useFakeTimers();
    await startPlaybackService(deps);
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    fake.emit({ playing: true, currentTime: 30, duration: 120 });

    await vi.advanceTimersByTimeAsync(15_000);
    expect(deps.savePosition).toHaveBeenCalledWith({
      contentId: 'a',
      positionMs: 30_000,
      durationMs: 120_000,
    });
  });
});

describe('interruptions', () => {
  it('resumes on foreground after an unexpected pause', async () => {
    await startPlaybackService(deps);
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    fake.emit({ playing: true, currentTime: 5, duration: 60 });
    vi.mocked(fake.player.play).mockClear();

    // OS took the session — not a user pause, not end of track.
    fake.emit({ playing: false, currentTime: 5, duration: 60 });
    handlePlaybackForeground();
    expect(fake.player.play).toHaveBeenCalled();
  });

  it('does not resume after a user pause', async () => {
    await startPlaybackService(deps);
    store.playFrom({ origin: ORIGIN, items: ITEMS });
    fake.emit({ playing: true, currentTime: 5, duration: 60 });
    store.pause();
    fake.emit({ playing: false, currentTime: 5, duration: 60 });
    vi.mocked(fake.player.play).mockClear();

    handlePlaybackForeground();
    expect(fake.player.play).not.toHaveBeenCalled();
  });
});

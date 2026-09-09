/**
 * PlaybackService — the singleton that owns the native audio player and
 * translates store intent ⇄ engine. It outlives every screen.
 *
 * Every side effect is injected (`PlaybackServiceDeps`) so this module imports
 * no React Native, expo-audio, or Sentry code and stays unit-testable in a
 * plain Node environment (`service.test.ts`). `index.ts` wires the real
 * expo-audio adapter, AsyncStorage persistence, and the resume API into it.
 */

import {
  playbackItemToMetadata,
  playbackSourceUri,
  type AudioMetadata,
} from './metadata';
import type { SavePlaybackPositionInput, ResumeTarget } from './remote';
import * as store from './store';
import type { PlaybackItem } from './types';

const HEARTBEAT_MS = 15_000;
const MAX_CONSECUTIVE_ERRORS = 2;

/** The subset of expo-audio's `AudioStatus` the service reacts to. */
export interface EnginePlayerStatus {
  currentTime?: number;
  duration?: number;
  playing: boolean;
  didJustFinish: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  error?: string;
}

export interface EngineLockScreenOptions {
  showSeekForward?: boolean;
  showSeekBackward?: boolean;
}

/** The subset of expo-audio's `AudioPlayer` the service drives. */
export interface EnginePlayer {
  loop: boolean;
  replace(_source: { uri: string }): void;
  play(): void;
  pause(): void;
  seekTo(_seconds: number): Promise<void> | void;
  addListener(
    _event: 'playbackStatusUpdate',
    _listener: (_status: EnginePlayerStatus) => void,
  ): { remove(): void };
  setActiveForLockScreen(
    _active: boolean,
    _metadata?: AudioMetadata,
    _options?: EngineLockScreenOptions,
  ): void;
  updateLockScreenMetadata(_metadata: AudioMetadata): void;
  release?(): void;
}

export interface PlaybackServiceDeps {
  createPlayer(): EnginePlayer;
  activateSession(): Promise<void>;
  savePosition(_input: SavePlaybackPositionInput): Promise<void>;
  fetchResume(): Promise<ResumeTarget | null>;
  reportBreadcrumb(_message: string, _data?: Record<string, unknown>): void;
}

interface ServiceState {
  deps: PlaybackServiceDeps;
  player: EnginePlayer;
  statusSub: { remove(): void };
  heartbeat: ReturnType<typeof setInterval>;
  consecutiveErrors: number;
  userInitiatedPause: boolean;
  pausedForInterruption: boolean;
  hasLockScreen: boolean;
  wasPlaying: boolean;
  lastSavedPositionMs: number;
}

let service: ServiceState | null = null;

// ─── lifecycle ───────────────────────────────────────────────────────────────

/** Idempotent. Safe to call on every app launch. */
export async function startPlaybackService(deps: PlaybackServiceDeps): Promise<void> {
  if (service) return;

  await deps.activateSession().catch(() => undefined);
  const player = deps.createPlayer();

  const statusSub = player.addListener('playbackStatusUpdate', onStatus);
  const heartbeat = setInterval(() => void flushPosition(), HEARTBEAT_MS);

  service = {
    deps,
    player,
    statusSub,
    heartbeat,
    consecutiveErrors: 0,
    userInitiatedPause: false,
    pausedForInterruption: false,
    hasLockScreen: false,
    wasPlaying: false,
    lastSavedPositionMs: 0,
  };

  store.registerPlaybackEngine({
    load: (item, { autoplay }) => loadTrack(item, autoplay),
    play: () => {
      if (!service) return;
      service.userInitiatedPause = false;
      service.pausedForInterruption = false;
      service.player.play();
    },
    pause: () => {
      if (!service) return;
      service.userInitiatedPause = true;
      service.player.pause();
      void flushPosition();
    },
    seekTo: (positionMs) => void service?.player.seekTo(positionMs / 1000),
    stop: () => {
      if (!service) return;
      service.player.pause();
      void flushPosition();
      service.player.setActiveForLockScreen(false);
      service.hasLockScreen = false;
    },
    setLoop: (loop) => {
      if (service) service.player.loop = loop;
    },
    syncMetadata: (item) => {
      if (item) syncLockScreen(item);
      else if (service) {
        service.player.setActiveForLockScreen(false);
        service.hasLockScreen = false;
      }
    },
  });

  // Restore the last session (paused) so the mini player comes back on launch.
  const restored = await store.hydratePlaybackSession().catch(() => null);
  if (restored?.nowPlaying && restored.nowPlaying.source.kind !== 'youtube') {
    loadTrack(restored.nowPlaying, false, restored.positionMs);
  }

  // Offer a "Resume '<title>'?" chip from the server-side position.
  const resume = await deps.fetchResume().catch(() => null);
  if (resume) store.setResumeTarget(resume);
}

/** Test-only teardown. */
export function stopPlaybackService(): void {
  if (!service) return;
  clearInterval(service.heartbeat);
  service.statusSub.remove();
  service.player.release?.();
  store.registerPlaybackEngine(null);
  service = null;
}

// ─── engine control ──────────────────────────────────────────────────────────

function loadTrack(item: PlaybackItem, autoplay: boolean, seekMs = 0): void {
  if (!service) return;
  const uri = playbackSourceUri(item.source);
  if (!uri) return;

  service.consecutiveErrors = 0;
  service.userInitiatedPause = !autoplay;
  service.pausedForInterruption = false;
  service.player.replace({ uri });
  if (seekMs > 0) void service.player.seekTo(seekMs / 1000);
  if (autoplay) service.player.play();
  syncLockScreen(item);
}

function syncLockScreen(item: PlaybackItem): void {
  if (!service) return;
  const metadata = playbackItemToMetadata(item);
  if (service.hasLockScreen) {
    service.player.updateLockScreenMetadata(metadata);
  } else {
    service.player.setActiveForLockScreen(true, metadata, {
      showSeekForward: true,
      showSeekBackward: true,
    });
    service.hasLockScreen = true;
  }
}

// ─── engine → store ──────────────────────────────────────────────────────────

function onStatus(status: EnginePlayerStatus): void {
  if (!service) return;

  if (status.error) {
    handleError(status.error);
    return;
  }

  const positionMs = Math.max(0, (status.currentTime ?? 0) * 1000);
  const durationMs = Math.max(0, (status.duration ?? 0) * 1000);

  store.reportEngineStatus({
    isLoaded: status.isLoaded,
    playing: status.playing,
    isBuffering: status.isBuffering,
    positionMs,
    durationMs,
  });

  // An unexpected stop (incoming call, another app took the session) — not a
  // user pause and not end-of-track — is an interruption we should recover from.
  if (
    service.wasPlaying &&
    !status.playing &&
    status.isLoaded &&
    !status.didJustFinish &&
    !service.userInitiatedPause
  ) {
    service.pausedForInterruption = true;
  }
  service.wasPlaying = status.playing;

  if (status.didJustFinish) {
    service.consecutiveErrors = 0;
    void flushPosition(true);
    store.reportEngineFinished();
  }
}

function handleError(message: string): void {
  if (!service) return;
  service.consecutiveErrors += 1;
  service.deps.reportBreadcrumb('playback engine error', {
    message,
    consecutive: service.consecutiveErrors,
  });
  if (service.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    service.consecutiveErrors = 0;
    store.next('auto');
    return;
  }
  store.reportEngineError(message);
}

// ─── heartbeat ───────────────────────────────────────────────────────────────

async function flushPosition(finished = false): Promise<void> {
  if (!service) return;
  const { nowPlaying } = store.getPlaybackState();
  if (!nowPlaying || nowPlaying.source.kind === 'youtube') return;

  const { positionMs, durationMs } = store.getPlaybackProgress();
  if (positionMs <= 0 && !finished) return;
  if (!finished && Math.abs(positionMs - service.lastSavedPositionMs) < 1_000) return;
  service.lastSavedPositionMs = positionMs;

  await service.deps
    .savePosition({
      contentId: nowPlaying.id,
      positionMs: finished ? durationMs || positionMs : positionMs,
      durationMs,
    })
    .catch(() => undefined);
}

// ─── app lifecycle ───────────────────────────────────────────────────────────

/** Called by `index.ts` on `AppState` → `active`. Resumes after an interruption. */
export function handlePlaybackForeground(): void {
  if (!service?.pausedForInterruption) return;
  service.pausedForInterruption = false;
  service.userInitiatedPause = false;
  service.player.play();
}

/** Called by `index.ts` when the OS is about to kill the app / on background. */
export function handlePlaybackBackground(): void {
  void flushPosition();
}

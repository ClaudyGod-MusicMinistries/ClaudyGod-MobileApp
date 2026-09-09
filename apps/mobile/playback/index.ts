/**
 * Public entry point for the playback feature.
 *
 * UI imports selectors and intent actions from here. `app/_layout.tsx` calls
 * `initPlaybackService()` once on launch. This module (unlike `store.ts` /
 * `service.ts` / `metadata.ts`) pulls in React Native, AsyncStorage, expo-audio
 * and Sentry — it must never be imported from a unit test.
 */

import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { reportBreadcrumb } from '../lib/sentry';
import { fetchResumeTarget, savePlaybackPosition } from './remote';
import { createExpoAudioPlayer, activateAudioSession } from './expoAudioAdapter';
import {
  handlePlaybackBackground,
  handlePlaybackForeground,
  startPlaybackService,
} from './service';
import { registerPlaybackPersistence, type PersistedSession } from './store';

export { feedItemToPlaybackItem, type AudioMetadata } from './metadata';
export type { PlaybackItem, QueueOrigin, RepeatMode } from './types';
export {
  usePlayback,
  usePlaybackProgress,
  usePlaybackVisible,
  getPlaybackState,
  playFrom,
  play,
  pause,
  toggle,
  next,
  previous,
  seekTo,
  playNext,
  addToQueue,
  removeFromQueue,
  reorderQueue,
  setRepeat,
  cycleRepeat,
  toggleShuffle,
  stop,
  dismissResumeTarget,
  playResumeTarget,
  setAutoplayEnabled,
  type PlaybackCoreState,
  type PlaybackStatus,
} from './store';

const SESSION_KEY = 'playback.session.v1';

let initialized = false;

export async function initPlaybackService(): Promise<void> {
  if (initialized) return;
  initialized = true;

  registerPlaybackPersistence({
    async load() {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as PersistedSession) : null;
      } catch {
        return null;
      }
    },
    save(session) {
      const write = session
        ? AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))
        : AsyncStorage.removeItem(SESSION_KEY);
      void write.catch(() => undefined);
    },
  });

  AppState.addEventListener('change', (state) => {
    if (state === 'active') handlePlaybackForeground();
    else handlePlaybackBackground();
  });

  await startPlaybackService({
    createPlayer: createExpoAudioPlayer,
    activateSession: activateAudioSession,
    savePosition: savePlaybackPosition,
    fetchResume: fetchResumeTarget,
    reportBreadcrumb: (message, data) =>
      reportBreadcrumb({ category: 'playback', message, level: 'info', data }),
  });
}

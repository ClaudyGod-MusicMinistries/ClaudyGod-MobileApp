/**
 * The one place expo-audio is imported. Wraps `createAudioPlayer` and the audio
 * session calls behind the `EnginePlayer` interface the service consumes, so the
 * service itself stays free of native imports and unit-testable.
 */

import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';

import type { EnginePlayer } from './service';

export function createExpoAudioPlayer(): EnginePlayer {
  // 250ms status cadence → a smooth scrubber without flooding the store.
  return createAudioPlayer(null, { updateInterval: 250 }) as unknown as EnginePlayer;
}

export async function activateAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    // Music and sermons keep playing when the app backgrounds or the screen
    // locks. iOS UIBackgroundModes: ['audio'] is declared in app.config.js.
    shouldPlayInBackground: true,
    // `doNotMix` is required for lock-screen / Control Center controls to bind
    // to this player, and is the right call for worship audio — take the
    // session rather than duck under other apps.
    interruptionMode: 'doNotMix',
  });
  await setIsAudioActiveAsync(true);
}

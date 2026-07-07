import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { FeedCardItem } from '../services/contentService';
import { usePlayerProgress } from './PlayerProgressContext';

// Floating player allows users to minimize and keep playing while navigating.
// Supports both audio (music) and video content.
//
// Playback progress (currentTime/duration) lives in the separate, high-frequency
// PlayerProgressContext — this context only holds identity/controls state, which
// changes far less often, so a progress tick no longer re-renders every consumer here
// (e.g. the root layout, which only needs to know whether a player is active).

export type PlayerType = 'audio' | 'video' | null;

interface PlayerState {
  type: PlayerType;
  content: FeedCardItem | null;
  isMinimized: boolean;
  isPlaying: boolean;
  playlist: FeedCardItem[];
  currentIndex: number;
  controls?: {
    pause: () => void;
    resume: () => void;
  };
}

type PlayerContextValue = {
  player: PlayerState;
  startPlaying: (_content: FeedCardItem, _type: PlayerType, _playlist?: FeedCardItem[]) => void;
  pause: () => void;
  resume: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaylist: (_items: FeedCardItem[]) => void;
  setPlaybackControls: (_controls?: { pause: () => void; resume: () => void }) => void;
};

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

const INITIAL_STATE: PlayerState = {
  type: null,
  content: null,
  isMinimized: false,
  isPlaying: false,
  playlist: [],
  currentIndex: 0,
  controls: undefined,
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>(INITIAL_STATE);
  const { resetProgress } = usePlayerProgress();
  const controlsRef = useRef<{ pause: () => void; resume: () => void } | undefined>(undefined);

  useEffect(() => {
    controlsRef.current = player.controls;
  }, [player.controls]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        controlsRef.current?.pause();
        setPlayer((prev) => (prev.isPlaying ? { ...prev, isPlaying: false } : prev));
      }
    });
    return () => sub.remove();
  }, []);

  const startPlaying = useCallback(
    (content: FeedCardItem, type: PlayerType, playlist: FeedCardItem[] = []) => {
      const actualPlaylist = playlist.length > 0 ? playlist : [content];
      const currentIndex = actualPlaylist.findIndex((item) => item.id === content.id);

      resetProgress();
      setPlayer({
        type,
        content,
        isMinimized: false,
        isPlaying: true,
        playlist: actualPlaylist,
        currentIndex: currentIndex >= 0 ? currentIndex : 0,
      });
    },
    [resetProgress],
  );

  const pause = useCallback(() => {
    player.controls?.pause();
    setPlayer((prev) => ({ ...prev, isPlaying: false }));
  }, [player.controls]);

  const resume = useCallback(() => {
    player.controls?.resume();
    setPlayer((prev) => ({ ...prev, isPlaying: true }));
  }, [player.controls]);

  const minimize = useCallback(() => {
    setPlayer((prev) => ({ ...prev, isMinimized: true }));
  }, []);

  const maximize = useCallback(() => {
    setPlayer((prev) => ({ ...prev, isMinimized: false }));
  }, []);

  const close = useCallback(() => {
    player.controls?.pause();
    resetProgress();
    setPlayer(INITIAL_STATE);
  }, [player.controls, resetProgress]);

  const playNext = useCallback(() => {
    resetProgress();
    setPlayer((prev) => {
      if (prev.playlist.length === 0) return prev;

      const nextIndex = (prev.currentIndex + 1) % prev.playlist.length;
      const nextContent = prev.playlist[nextIndex];

      return {
        ...prev,
        content: nextContent,
        currentIndex: nextIndex,
        isPlaying: true,
      };
    });
  }, [resetProgress]);

  const playPrevious = useCallback(() => {
    resetProgress();
    setPlayer((prev) => {
      if (prev.playlist.length === 0) return prev;

      const prevIndex = (prev.currentIndex - 1 + prev.playlist.length) % prev.playlist.length;
      const prevContent = prev.playlist[prevIndex];

      return {
        ...prev,
        content: prevContent,
        currentIndex: prevIndex,
        isPlaying: true,
      };
    });
  }, [resetProgress]);

  const setPlaylist = useCallback((items: FeedCardItem[]) => {
    setPlayer((prev) => ({
      ...prev,
      playlist: items,
      currentIndex: prev.currentIndex < items.length ? prev.currentIndex : 0,
    }));
  }, []);

  const setPlaybackControls = useCallback((controls?: { pause: () => void; resume: () => void }) => {
    setPlayer((prev) => ({
      ...prev,
      controls,
    }));
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        player,
        startPlaying,
        pause,
        resume,
        minimize,
        maximize,
        close,
        playNext,
        playPrevious,
        setPlaylist,
        setPlaybackControls,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error('usePlayer must be used inside PlayerProvider');
  }

  return context;
}

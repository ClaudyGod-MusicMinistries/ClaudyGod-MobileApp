import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FeedCardItem } from '../services/contentService';

// Floating player allows users to minimize and keep playing while navigating
// Supports both audio (music) and video content

export type PlayerType = 'audio' | 'video' | null;

interface FloatingPlayerState {
  type: PlayerType;
  content: FeedCardItem | null;
  isMinimized: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playlist: FeedCardItem[];
  currentIndex: number;
  controls?: {
    pause: () => void;
    resume: () => void;
  };
}

type FloatingPlayerContextValue = {
  player: FloatingPlayerState;
  startPlaying: (_content: FeedCardItem, _type: PlayerType, _playlist?: FeedCardItem[]) => void;
  pause: () => void;
  resume: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  updateProgress: (_currentTime: number, _duration: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaylist: (_items: FeedCardItem[]) => void;
  setPlaybackControls: (_controls?: { pause: () => void; resume: () => void }) => void;
};

const FloatingPlayerContext = createContext<FloatingPlayerContextValue | undefined>(undefined);

const INITIAL_STATE: FloatingPlayerState = {
  type: null,
  content: null,
  isMinimized: false,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playlist: [],
  currentIndex: 0,
  controls: undefined,
};

export function FloatingPlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<FloatingPlayerState>(INITIAL_STATE);

  const startPlaying = useCallback(
    (content: FeedCardItem, type: PlayerType, playlist: FeedCardItem[] = []) => {
      const actualPlaylist = playlist.length > 0 ? playlist : [content];
      const currentIndex = actualPlaylist.findIndex((item) => item.id === content.id);

      setPlayer({
        type,
        content,
        isMinimized: false,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
        playlist: actualPlaylist,
        currentIndex: currentIndex >= 0 ? currentIndex : 0,
      });
    },
    [],
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
    setPlayer(INITIAL_STATE);
  }, []);

  const updateProgress = useCallback((currentTime: number, duration: number) => {
    setPlayer((prev) => ({
      ...prev,
      currentTime,
      duration,
    }));
  }, []);

  const playNext = useCallback(() => {
    setPlayer((prev) => {
      if (prev.playlist.length === 0) return prev;

      const nextIndex = (prev.currentIndex + 1) % prev.playlist.length;
      const nextContent = prev.playlist[nextIndex];

      return {
        ...prev,
        content: nextContent,
        currentIndex: nextIndex,
        currentTime: 0,
        duration: 0,
        isPlaying: true,
      };
    });
  }, []);

  const playPrevious = useCallback(() => {
    setPlayer((prev) => {
      if (prev.playlist.length === 0) return prev;

      const prevIndex = (prev.currentIndex - 1 + prev.playlist.length) % prev.playlist.length;
      const prevContent = prev.playlist[prevIndex];

      return {
        ...prev,
        content: prevContent,
        currentIndex: prevIndex,
        currentTime: 0,
        duration: 0,
        isPlaying: true,
      };
    });
  }, []);

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
    <FloatingPlayerContext.Provider
      value={{
        player,
        startPlaying,
        pause,
        resume,
        minimize,
        maximize,
        close,
        updateProgress,
        playNext,
        playPrevious,
        setPlaylist,
        setPlaybackControls,
      }}
    >
      {children}
    </FloatingPlayerContext.Provider>
  );
}

export function useFloatingPlayer() {
  const context = useContext(FloatingPlayerContext);

  if (!context) {
    throw new Error('useFloatingPlayer must be used inside FloatingPlayerProvider');
  }

  return context;
}

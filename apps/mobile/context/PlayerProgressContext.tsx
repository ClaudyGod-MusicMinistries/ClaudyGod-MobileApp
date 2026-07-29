import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// High-frequency playback progress (currentTime/duration), split out from PlayerContext so
// that a progress tick doesn't re-render every consumer of player identity/controls —
// only whatever actually renders a progress bar should re-render on each tick.

interface PlayerProgressState {
  currentTime: number;
  duration: number;
}

type PlayerProgressContextValue = PlayerProgressState & {
  updateProgress: (_currentTime: number, _duration: number) => void;
  resetProgress: () => void;
};

const INITIAL_STATE: PlayerProgressState = { currentTime: 0, duration: 0 };

const PlayerProgressContext = createContext<PlayerProgressContextValue | undefined>(undefined);

export function PlayerProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<PlayerProgressState>(INITIAL_STATE);

  const updateProgress = useCallback((currentTime: number, duration: number) => {
    setProgress({ currentTime, duration });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(INITIAL_STATE);
  }, []);

  return (
    <PlayerProgressContext.Provider value={{ ...progress, updateProgress, resetProgress }}>
      {children}
    </PlayerProgressContext.Provider>
  );
}

export function usePlayerProgress() {
  const context = useContext(PlayerProgressContext);

  if (!context) {
    throw new Error('usePlayerProgress must be used inside PlayerProgressProvider');
  }

  return context;
}

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MobileAuthUser } from '../services/authService';

// Guest mode stores tokens in-memory ONLY (never persisted to storage)
// This ensures secure guest access without persistent credentials

interface GuestSession {
  accessToken: string | null;
  user: MobileAuthUser | null;
}

type GuestModeContextValue = {
  isGuestMode: boolean;
  guestSession: GuestSession;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  setGuestSession: (_session: GuestSession) => void;
};

const GuestModeContext = createContext<GuestModeContextValue | undefined>(undefined);

export function GuestModeProvider({ children }: { children: ReactNode }) {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestSession, setGuestSession] = useState<GuestSession>({
    accessToken: null,
    user: null,
  });

  const enterGuestMode = useCallback(() => {
    setIsGuestMode(true);
    // Reset guest session when entering guest mode
    setGuestSession({
      accessToken: null,
      user: null,
    });
  }, []);

  const exitGuestMode = useCallback(() => {
    setIsGuestMode(false);
    // Clear guest session data
    setGuestSession({
      accessToken: null,
      user: null,
    });
  }, []);

  const updateGuestSession = useCallback((session: GuestSession) => {
    if (isGuestMode) {
      setGuestSession(session);
    }
  }, [isGuestMode]);

  return (
    <GuestModeContext.Provider
      value={{
        isGuestMode,
        guestSession,
        enterGuestMode,
        exitGuestMode,
        setGuestSession: updateGuestSession,
      }}
    >
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestModeContext);

  if (!context) {
    throw new Error('useGuestMode must be used inside GuestModeProvider');
  }

  return context;
}

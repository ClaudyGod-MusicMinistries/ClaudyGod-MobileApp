import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { MobileAuthUser } from '../services/authService';
import { restoreMobileSession, subscribeToMobileAuthStateChange } from '../services/authService';
import { exportForAccountSync, clearAllGuestData } from '../lib/guestStorage';
import { apiFetchWithMobileSession } from '../services/authService';

type AuthContextValue = {
  accessToken: string | null;
  user: MobileAuthUser | null;
  initializing: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function syncGuestDataToAccount() {
  try {
    const payload = await exportForAccountSync();
    if (!payload.favorites.length && !payload.historyIds.length) return;
    await apiFetchWithMobileSession('/v1/mobile/guest-sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await clearAllGuestData();
  } catch {
    // Best-effort — don't block sign-in if sync fails
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileAuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    void restoreMobileSession()
      .then((storedSession) => {
        if (!active) return;
        setAccessToken(storedSession.accessToken);
        setUser(storedSession.user);
        prevUserId.current = storedSession.user?.id ?? null;
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    const unsubscribe = subscribeToMobileAuthStateChange((nextSession) => {
      const nextUserId = nextSession.user?.id ?? null;
      const wasGuest = prevUserId.current === null;
      const isNowSignedIn = nextUserId !== null;

      if (wasGuest && isNowSignedIn) {
        // Transition: guest → signed in. Sync then clear guest data.
        void syncGuestDataToAccount();
      }

      prevUserId.current = nextUserId;
      setAccessToken(nextSession.accessToken);
      setUser(nextSession.user);
      setInitializing(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        initializing,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

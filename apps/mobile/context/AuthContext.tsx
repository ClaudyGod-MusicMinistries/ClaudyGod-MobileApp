import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { MobileAuthUser } from '../services/authService';
import { getStoredMobileSession, subscribeToMobileAuthStateChange } from '../services/authService';

type AuthContextValue = {
  accessToken: string | null;
  user: MobileAuthUser | null;
  initializing: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileAuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    void getStoredMobileSession()
      .then((storedSession) => {
        if (!active) {
          return;
        }

        setAccessToken(storedSession.accessToken);
        setUser(storedSession.user);
      })
      .finally(() => {
        if (active) {
          setInitializing(false);
        }
      });

    const unsubscribe = subscribeToMobileAuthStateChange((nextSession) => {
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
        isAuthenticated: Boolean(accessToken && user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MobileAuthUser } from '../services/authService';
import {
  clearMobileSession,
  restoreMobileSession,
  subscribeToMobileAuthStateChange,
} from '../services/authService';

interface UserAccountContextValue {
  account: MobileAuthUser | null;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  isSheetOpen: boolean;
  openAccountSheet: () => void;
  closeAccountSheet: () => void;
}

const UserAccountContext = createContext<UserAccountContextValue>({
  account: null,
  isSignedIn: false,
  signOut: async () => {},
  isSheetOpen: false,
  openAccountSheet: () => {},
  closeAccountSheet: () => {},
});

export function UserAccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<MobileAuthUser | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    void restoreMobileSession().then((snapshot) => {
      if (snapshot.user) setAccount(snapshot.user);
    });

    return subscribeToMobileAuthStateChange((snapshot) => {
      setAccount(snapshot.user);
    });
  }, []);

  const signOut = async () => {
    await clearMobileSession();
  };

  return (
    <UserAccountContext.Provider
      value={{
        account,
        isSignedIn: !!account,
        signOut,
        isSheetOpen,
        openAccountSheet: () => setIsSheetOpen(true),
        closeAccountSheet: () => setIsSheetOpen(false),
      }}
    >
      {children}
    </UserAccountContext.Provider>
  );
}

export function useUserAccount() {
  return useContext(UserAccountContext);
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MobileAuthUser } from '../services/authService';
import {
  clearMobileSession,
  restoreMobileSession,
  subscribeToMobileAuthStateChange,
} from '../services/authService';
import { saveMeLibraryItem } from '../services/userFlowService';
import {
  getFavorites,
  hasMigratedFavoritesToServer,
  markFavoritesMigratedToServer,
} from '../lib/localUserStorage';

interface UserAccountContextValue {
  account: MobileAuthUser | null;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
}

const UserAccountContext = createContext<UserAccountContextValue>({
  account: null,
  isSignedIn: false,
  signOut: async () => {},
});

// Best-effort, one-time push of any local guest favorites up to the real
// account once signed in — the local copy stays in place afterward as a
// harmless guest-mode fallback rather than being deleted, so a partially
// failed migration never loses data.
async function migrateLocalFavoritesToServer(): Promise<void> {
  if (await hasMigratedFavoritesToServer()) return;

  try {
    const localFavorites = await getFavorites();
    await Promise.all(
      localFavorites.map((item) =>
        saveMeLibraryItem({
          bucket: 'liked',
          contentId: item.id,
          contentType: item.type,
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          imageUrl: item.imageUrl || undefined,
          mediaUrl: item.mediaUrl,
          duration: item.duration,
        }).catch(() => { /* best-effort per item — a single bad item shouldn't block the rest */ }),
      ),
    );
  } finally {
    await markFavoritesMigratedToServer();
  }
}

export function UserAccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<MobileAuthUser | null>(null);

  useEffect(() => {
    void restoreMobileSession().then((snapshot) => {
      if (snapshot.user) setAccount(snapshot.user);
    });

    return subscribeToMobileAuthStateChange((snapshot) => {
      setAccount(snapshot.user);
    });
  }, []);

  useEffect(() => {
    if (account) {
      void migrateLocalFavoritesToServer();
    }
  }, [account]);

  const signOut = async () => {
    await clearMobileSession();
  };

  return (
    <UserAccountContext.Provider value={{ account, isSignedIn: !!account, signOut }}>
      {children}
    </UserAccountContext.Provider>
  );
}

export function useUserAccount() {
  return useContext(UserAccountContext);
}

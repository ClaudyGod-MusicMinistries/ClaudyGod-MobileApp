import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MobileAuthUser } from '../services/authService';
import {
  clearMobileSession,
  restoreMobileSession,
  subscribeToMobileAuthStateChange,
} from '../services/authService';
import { saveMeLibraryItem } from '../services/userFlowService';
import { trackPlayEvent } from '../services/supabaseAnalytics';
import {
  getFavorites,
  getHistory,
  hasMigratedFavoritesToServer,
  markFavoritesMigratedToServer,
  hasMigratedHistoryToServer,
  markHistoryMigratedToServer,
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

// In-memory locks, not persisted guards — the `[account]` effect below can
// re-fire before a prior migration's AsyncStorage guard flag has finished
// writing (its check-then-act isn't atomic against a second concurrent call),
// which would otherwise let both calls pass the "already migrated?" check and
// double-post every item. These close that specific race within one app
// session; cross-session/cross-device double-migration was already an
// accepted, non-destructive risk (duplicate play/favorite events, not data
// loss) and remains so.
let favoritesMigrationInFlight = false;
let historyMigrationInFlight = false;

// Best-effort, one-time push of any local guest favorites up to the real
// account once signed in — the local copy stays in place afterward as a
// harmless guest-mode fallback rather than being deleted, so a partially
// failed migration never loses data. Only marked complete after the local
// read + upload attempts actually finish — if `getFavorites()` itself throws,
// migration is left unmarked so a later app open retries instead of silently
// giving up forever.
async function migrateLocalFavoritesToServer(): Promise<void> {
  if (favoritesMigrationInFlight || await hasMigratedFavoritesToServer()) return;
  favoritesMigrationInFlight = true;

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
    await markFavoritesMigratedToServer();
  } catch {
    // Local read failed — leave unmigrated so a later app open retries.
  } finally {
    favoritesMigrationInFlight = false;
  }
}

// Same one-time, tolerant, non-destructive migration as favorites above, but
// for guest listening history — closes the gap where the sign-in prompt
// promises "picks based on what you actually play" but only favorites ever
// made it to the server. `trackPlayEvent` already swallows its own errors,
// so a single bad item can't block the rest.
async function migrateLocalHistoryToServer(): Promise<void> {
  if (historyMigrationInFlight || await hasMigratedHistoryToServer()) return;
  historyMigrationInFlight = true;

  try {
    const localHistory = await getHistory();
    await Promise.all(
      localHistory.map((item) =>
        trackPlayEvent({
          contentId: item.id,
          contentType: item.type,
          title: item.title,
          source: 'guest_migration',
        }),
      ),
    );
    await markHistoryMigratedToServer();
  } catch {
    // Local read failed — leave unmigrated so a later app open retries.
  } finally {
    historyMigrationInFlight = false;
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
      void migrateLocalHistoryToServer();
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

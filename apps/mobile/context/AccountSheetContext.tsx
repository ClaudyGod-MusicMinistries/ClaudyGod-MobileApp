import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

// Account-sheet open/close is UI-visibility state, unrelated to account identity — split
// out from UserAccountContext so toggling the sheet doesn't re-render anything that only
// cares about who's signed in.

interface AccountSheetContextValue {
  isSheetOpen: boolean;
  openAccountSheet: () => void;
  closeAccountSheet: () => void;
}

const AccountSheetContext = createContext<AccountSheetContextValue | undefined>(undefined);

export function AccountSheetProvider({ children }: { children: ReactNode }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const openAccountSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeAccountSheet = useCallback(() => setIsSheetOpen(false), []);

  const value = useMemo(
    () => ({ isSheetOpen, openAccountSheet, closeAccountSheet }),
    [isSheetOpen, openAccountSheet, closeAccountSheet],
  );

  return (
    <AccountSheetContext.Provider value={value}>
      {children}
    </AccountSheetContext.Provider>
  );
}

export function useAccountSheet() {
  const context = useContext(AccountSheetContext);

  if (!context) {
    throw new Error('useAccountSheet must be used inside AccountSheetProvider');
  }

  return context;
}

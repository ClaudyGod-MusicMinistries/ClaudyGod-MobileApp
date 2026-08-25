import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { fetchWordOfDay, type WordOfDayItem } from '../services/wordOfDayService';
import { fetchBibleDailyVerse } from '../services/bibleApiService';

export interface WordOfDayState {
  bibleVerse: WordOfDayItem | null;
  adminWord: WordOfDayItem | null;
  loading: boolean;
  hasContent: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const WordOfDayContext = createContext<WordOfDayState | undefined>(undefined);

export function WordOfDayProvider({ children }: { children: ReactNode }) {
  const [bibleVerse, setBibleVerse] = useState<WordOfDayItem | null>(null);
  const [adminWord, setAdminWord] = useState<WordOfDayItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
      setLoading(true);
      setError(null);
      const [bibleResult, adminResult] = await Promise.allSettled([
        fetchBibleDailyVerse(),
        fetchWordOfDay(),
      ]);

      if (!mounted.current) return;

      if (bibleResult.status === 'fulfilled') {
        setBibleVerse(bibleResult.value);
      }
      if (adminResult.status === 'fulfilled' && adminResult.value.word) {
        setAdminWord(adminResult.value.word);
      }
      if (bibleResult.status === 'rejected' && adminResult.status === 'rejected') {
        setError('Today’s teaching could not be loaded. Check your connection and try again.');
      }
      setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => { mounted.current = false; };
  }, [load]);

  return (
    <WordOfDayContext.Provider
      value={{
        bibleVerse,
        adminWord,
        loading,
        hasContent: bibleVerse !== null || adminWord !== null,
        error,
        refresh: load,
      }}
    >
      {children}
    </WordOfDayContext.Provider>
  );
}

export function useWordOfDayContext(): WordOfDayState {
  const ctx = useContext(WordOfDayContext);
  if (!ctx) throw new Error('useWordOfDayContext must be used inside WordOfDayProvider');
  return ctx;
}

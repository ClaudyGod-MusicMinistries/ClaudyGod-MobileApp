import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchWordOfDay, type WordOfDayItem } from '../services/wordOfDayService';
import { fetchBibleDailyVerse } from '../services/bibleApiService';

export interface WordOfDayState {
  bibleVerse: WordOfDayItem | null;
  adminWord: WordOfDayItem | null;
  loading: boolean;
  hasContent: boolean;
}

const WordOfDayContext = createContext<WordOfDayState | undefined>(undefined);

export function WordOfDayProvider({ children }: { children: ReactNode }) {
  const [bibleVerse, setBibleVerse] = useState<WordOfDayItem | null>(null);
  const [adminWord, setAdminWord] = useState<WordOfDayItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [bibleResult, adminResult] = await Promise.allSettled([
        fetchBibleDailyVerse(),
        fetchWordOfDay(),
      ]);

      if (!active) return;

      if (bibleResult.status === 'fulfilled') {
        setBibleVerse(bibleResult.value);
      }
      if (adminResult.status === 'fulfilled' && adminResult.value.word) {
        setAdminWord(adminResult.value.word);
      }
      setLoading(false);
    };

    void load();
    return () => { active = false; };
  }, []);

  return (
    <WordOfDayContext.Provider
      value={{
        bibleVerse,
        adminWord,
        loading,
        hasContent: bibleVerse !== null || adminWord !== null,
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

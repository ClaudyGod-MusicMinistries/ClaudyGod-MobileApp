import { useEffect, useState } from 'react';
import { fetchWordOfDay, type WordOfDayItem } from '../services/wordOfDayService';
import { fetchBibleDailyVerse } from '../services/bibleApiService';

export interface WordOfDayState {
  /** Live scripture from bible-api.com — rotates daily, always attempted. */
  bibleVerse: WordOfDayItem | null;
  /** Admin-authored word for today from the backend — null when not configured. */
  adminWord: WordOfDayItem | null;
  loading: boolean;
  /** True when at least one source returned content. */
  hasContent: boolean;
}

export function useWordOfDay(): WordOfDayState {
  const [bibleVerse, setBibleVerse] = useState<WordOfDayItem | null>(null);
  const [adminWord, setAdminWord] = useState<WordOfDayItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      // Fetch both sources concurrently — neither blocks the other.
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

  return {
    bibleVerse,
    adminWord,
    loading,
    hasContent: bibleVerse !== null || adminWord !== null,
  };
}

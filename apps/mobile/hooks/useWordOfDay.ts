import { useEffect, useState } from 'react';
import { fetchWordOfDay, type WordOfDayItem } from '../services/wordOfDayService';
import { fetchBibleDailyVerse } from '../services/bibleApiService';

export type WordSource = 'admin' | 'bible-api' | null;

export function useWordOfDay() {
  const [word, setWord] = useState<WordOfDayItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<WordSource>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        // Admin-configured word takes precedence
        const adminResponse = await fetchWordOfDay();
        if (!active) return;

        if (adminResponse.word) {
          setWord(adminResponse.word);
          setSource('admin');
          return;
        }

        // No admin content — fall back to Bible API (cached daily)
        const bibleWord = await fetchBibleDailyVerse();
        if (!active) return;
        setWord(bibleWord);
        setSource('bible-api');
      } catch {
        // On any failure still try Bible API
        if (!active) return;
        try {
          const bibleWord = await fetchBibleDailyVerse();
          if (!active) return;
          setWord(bibleWord);
          setSource('bible-api');
        } catch {
          // Fully offline — leave word as null
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, []);

  return { word, loading, source };
}

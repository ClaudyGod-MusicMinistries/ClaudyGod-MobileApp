import { useEffect, useState } from 'react';
import { fetchWordOfDay, type WordOfDayItem } from '../services/wordOfDayService';

export function useWordOfDay() {
  const [word, setWord] = useState<WordOfDayItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void fetchWordOfDay()
      .then((response) => {
        if (!active) return;
        setWord(response.word ?? null);
      })
      .catch((error) => {
        console.warn('wordOfDay fallback:', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { word, loading };
}

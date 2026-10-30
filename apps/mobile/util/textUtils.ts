/**
 * Text utility helpers for cleaning and presenting concise excerpts
 * on hero headers, release cards, and media banners with background images.
 */

export function cleanExcerpt(raw?: string | null, maxLength = 125): string {
  if (!raw || typeof raw !== 'string') return '';

  const lines = raw.split(/\r?\n/);
  const narrativeLines: string[] = [];

  const isBoilerplate = (line: string): boolean => {
    const l = line.trim();
    if (!l) return true;
    if (
      /^(song by|featured artist|producers?|singer\/songwriter|music by|directed by|written by|arranged by|mixed? by|mastered? by|praise & worship\/inspirational|track|album)\b/i.test(
        l,
      )
    ) {
      return true;
    }
    if (/^(producer|artist|singer)[\s:-]/i.test(l)) return true;
    if (/(https?:\/\/|www\.|@|mailto:|tel:|youtube channel|contact info|\.com\b|\.org\b)/i.test(l)) return true;
    if (/^#/.test(l)) return true;
    return false;
  };

  for (const line of lines) {
    if (!isBoilerplate(line)) {
      narrativeLines.push(line.trim());
    }
  }

  const combined = narrativeLines.join(' ').replace(/\s+/g, ' ').trim();
  if (!combined) {
    const fallback = (lines.find((l) => l.trim().length > 0) || '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/www\.\S+/g, '')
      .trim();
    return fallback.length > maxLength ? fallback.slice(0, maxLength).trim() + '…' : fallback;
  }

  // If the first complete sentence is between 25 and maxLength characters, use it cleanly
  const sentenceMatch = combined.match(/^([^.!?]+[.!?])/);
  if (sentenceMatch && sentenceMatch[1] && sentenceMatch[1].length <= maxLength && sentenceMatch[1].length >= 25) {
    return sentenceMatch[1].trim();
  }

  if (combined.length <= maxLength) {
    return combined;
  }

  const clamped = combined.slice(0, maxLength);
  const lastSpace = clamped.lastIndexOf(' ');
  return (lastSpace > 35 ? clamped.slice(0, lastSpace) : clamped).trim() + '…';
}


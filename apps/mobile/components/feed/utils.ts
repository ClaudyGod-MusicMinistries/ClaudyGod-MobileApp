import type { FeedCardItem } from '../../services/contentService';

export function cleanFeedText(value?: string | null): string {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Strips distracting promotional tags, boilerplate artist suffixes,
 * and YouTube artifact tags ("NEW!", "| Official Video", ". Afro Gospel Music by...")
 * so display headings look clean, intentional, and modern on cards and hero stages.
 */
export function cleanFeedTitle(value?: string | null): string {
  let text = cleanFeedText(value);
  if (!text) return '';

  // 1. Strip repetitive promotional leading tags ("Latest Release:", "NEW!!", etc.)
  text = text.replace(/^(NEW\s*!*|Latest\s+Release:?|New\s+Release:?|Official\s+Video:?|Official\s+Audio:?|Video:?|Audio:?|Song:?|Music:?|-|:|\s)+/i, '').trim();

  // 2. Strip trailing pipe/slash/hyphen media suffixes ("| Official Music Video", "// Audio")
  text = text.replace(/\s*(\||\/\/)\s*(Official\s+)?(Music\s+Video|Video|Audio|Visualizer|Lyrics?|Lyric\s+Video).*$/i, '').trim();
  text = text.replace(/\s*-\s*(Official\s+)?(Music\s+Video|Video|Audio|Visualizer|Lyric\s+Video).*$/i, '').trim();

  // 3. Strip trailing credit suffixes (". Afro Gospel Music by...", "- Song by...")
  text = text.replace(/\.\s+(Afro\s+Gospel\s+Music|Gospel\s+Music|Music\s+by|Song\s+by|Inspirational\s+Song).*$/i, '').trim();
  text = text.replace(/\s*[-–—]\s*(Song\s+by|Music\s+by|Afro\s+Gospel).*$/i, '').trim();

  // 4. Deduplicate adjacent case-insensitive duplicate parentheticals (e.g. "(Chukwu Idi Ebube) (Chukwu idi ebube)")
  text = text.replace(/\(([^)]+)\)\s*\(([^)]+)\)/gi, (match, p1, p2) => {
    return p1.trim().toLowerCase() === p2.trim().toLowerCase() ? `(${p1.trim()})` : match;
  });
  text = text.replace(/\[([^\]]+)\]\s*\[([^\]]+)\]/gi, (match, p1, p2) => {
    return p1.trim().toLowerCase() === p2.trim().toLowerCase() ? `[${p1.trim()}]` : match;
  });

  // 5. Strip trailing emojis that clutter card headings
  text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/gu, '').trim();

  // 6. Strip trailing isolated punctuation (e.g. trailing period from title)
  text = text.replace(/[.]+$/, '').trim();

  return text || cleanFeedText(value);
}

export function isValidDuration(d: string | null | undefined): boolean {
  if (!d) return false;
  const trimmed = d.trim();
  return trimmed.length > 0 && trimmed !== '--:--' && trimmed !== '0:00' && trimmed !== '00:00';
}

export function formatFeedMeta(item: FeedCardItem) {
  return [cleanFeedText(item.subtitle), isValidDuration(item.duration) ? item.duration : null].filter(Boolean).join(' · ');
}

function normalizeForComparison(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Admin-entered titles often already embed the channel/ministry name (e.g. "Worship
// Hour... ClaudyGOD Music & Ministries"), and subtitle independently defaults to the
// same channel name — rendering both then visibly repeats the same phrase.
export function isRedundantSubtitle(title?: string | null, subtitle?: string | null): boolean {
  const normalizedSubtitle = normalizeForComparison(cleanFeedText(subtitle));
  if (!normalizedSubtitle) return true;

  const normalizedTitle = normalizeForComparison(cleanFeedText(title));
  if (!normalizedTitle) return false;

  return (
    normalizedTitle === normalizedSubtitle ||
    normalizedTitle.includes(normalizedSubtitle) ||
    normalizedSubtitle.includes(normalizedTitle)
  );
}

export function dedupeFeedItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const result: FeedCardItem[] = [];
  for (const item of items) {
    const key =
      item.mediaUrl && item.mediaUrl.trim().length > 0
        ? `media:${item.mediaUrl.trim()}`
        : `id:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function getFeaturedItem(...groups: (FeedCardItem[] | null | undefined)[]) {
  for (const group of groups) {
    const item = group?.find((entry) => entry && entry.title);
    if (item) return item;
  }
  return null;
}

// ─── Card sizing ──────────────────────────────────────────────────────────────
// Single source of truth for ContentCard's dimensions. ContentRail (the
// horizontal FlashList) needs to size its container to the exact pixel the
// card will render at, or the list ends up with dead space below every rail —
// so both read from these instead of keeping their own copies of the formula.

export type CardVariant = 'portrait' | 'landscape' | 'square';

// Approximate height of the text block under the artwork (gap + up to a
// 2-line title + 1-line subtitle) — used only to size the FlashList
// container, which needs a fixed cross-axis size when horizontal.
export const CARD_TEXT_AREA_HEIGHT = 76;

export function getContentCardWidth(
  device: { isTV: boolean; isDesktop: boolean; isLargeDesktop?: boolean; isTablet?: boolean; width?: number },
  compact: boolean,
  fixedWidth?: number,
): number {
  if (fixedWidth) return fixedWidth;
  if (compact) return 176;
  if (device.isTV) return 320;
  if (device.isLargeDesktop) return 270;
  if (device.isDesktop) return 240;
  if (device.isTablet) return 210;
  return 184;
}

export function getContentCardHeight(cardWidth: number, variant: CardVariant): number {
  return variant === 'portrait' ? Math.round(cardWidth * 1.32)
    : variant === 'landscape' ? Math.round(cardWidth * 0.62)
    : cardWidth;
}

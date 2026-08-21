import type { FeedCardItem } from '../../services/contentService';

export function cleanFeedText(value?: string | null): string {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
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
export const CARD_TEXT_AREA_HEIGHT = 70;

export function getContentCardWidth(
  device: { isTV: boolean; isDesktop: boolean },
  compact: boolean,
  fixedWidth?: number,
): number {
  return fixedWidth ?? (compact ? 176 : device.isTV ? 260 : device.isDesktop ? 218 : 184);
}

export function getContentCardHeight(cardWidth: number, variant: CardVariant): number {
  return variant === 'portrait' ? Math.round(cardWidth * 1.32)
    : variant === 'landscape' ? Math.round(cardWidth * 0.62)
    : cardWidth;
}

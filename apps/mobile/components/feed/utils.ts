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

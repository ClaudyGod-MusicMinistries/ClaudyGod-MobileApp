import type { FeedBundle, FeedCardItem } from '../services/contentService';
import type { MobileAppExperienceConfig } from '../services/userFlowService';

export type MobileLayoutSection = MobileAppExperienceConfig['layout']['homeSections'][number];

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function dedupeItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  const result: FeedCardItem[] = [];

  for (const item of items) {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

function buildCuratedPool(feed: FeedBundle): FeedCardItem[] {
  return dedupeItems([
    ...feed.videos,
    ...feed.music,
    ...feed.playlists,
    ...feed.live,
    ...feed.announcements,
    ...feed.recent,
  ]);
}

export function getHomeLayoutSections(config?: MobileAppExperienceConfig | null): MobileLayoutSection[] {
  return config?.layout?.homeSections?.length ? config.layout.homeSections : [];
}

export function getVideoLayoutSections(config?: MobileAppExperienceConfig | null): MobileLayoutSection[] {
  return config?.layout?.videoSections?.length ? config.layout.videoSections : [];
}

export function getPlayerLayoutSections(config?: MobileAppExperienceConfig | null): MobileLayoutSection[] {
  return config?.layout?.playerSections?.length ? config.layout.playerSections : [];
}

export function getLibraryLayoutSections(config?: MobileAppExperienceConfig | null): MobileLayoutSection[] {
  return config?.layout?.librarySections?.length ? config.layout.librarySections : [];
}

export function matchesLayoutSection(item: FeedCardItem, section: MobileLayoutSection): boolean {
  const sectionTokens = new Set([normalizeToken(section.id), normalizeToken(section.title)]);
  return Boolean(
    item.appSections?.some((value) => sectionTokens.has(normalizeToken(value))),
  );
}

function resolveLayoutSectionPool(feed: FeedBundle, section: MobileLayoutSection): FeedCardItem[] {
  const pool = buildCuratedPool(feed);
  const curated = pool.filter((item) => matchesLayoutSection(item, section));
  if (curated.length > 0) {
    return curated;
  }

  // No content has been tagged into this section yet (e.g. it was just created) —
  // fall back to a type-based sample so the section isn't a blank gap.
  return pool.filter((item) => item.type !== 'ad' && section.contentTypes.includes(item.type));
}

export function deriveLayoutSectionItems(feed: FeedBundle, section: MobileLayoutSection): FeedCardItem[] {
  return resolveLayoutSectionPool(feed, section).slice(0, section.maxItems);
}

// The rest of the matched pool beyond maxItems — used to show a real "See all"
// overflow list instead of a button that claims there's more without proving it.
export function deriveLayoutSectionOverflow(feed: FeedBundle, section: MobileLayoutSection): FeedCardItem[] {
  return resolveLayoutSectionPool(feed, section).slice(section.maxItems);
}

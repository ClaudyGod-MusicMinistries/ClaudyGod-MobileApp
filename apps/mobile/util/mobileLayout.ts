import type { FeedBundle, FeedCardItem, LayoutScreen } from '../services/contentService';
import type { MobileAppExperienceConfig } from '../services/userFlowService';

export type MobileLayoutSection = MobileAppExperienceConfig['layout']['homeSections'][number];
export type { LayoutScreen };

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

// Section membership is now resolved server-side (mobile.service.ts,
// buildAllLayoutSections) from the same admin-tagged `appSections` the server
// ranks and dedupes against — these helpers just look up that precomputed
// result by section id so the client never re-derives (and can't drift from)
// what the server decided.
function findResolvedSection(feed: FeedBundle, screen: LayoutScreen, section: MobileLayoutSection) {
  return feed.layoutSections[screen].find((resolved) => resolved.id === section.id);
}

export function deriveLayoutSectionItems(
  feed: FeedBundle,
  section: MobileLayoutSection,
  screen: LayoutScreen,
): FeedCardItem[] {
  return findResolvedSection(feed, screen, section)?.items ?? [];
}

// How many more matched items exist beyond what's already shown — used to
// decide whether "See all" should be offered, without duplicating the actual
// overflow list client-side (the section-detail screen paginates it properly).
export function deriveLayoutSectionOverflowCount(
  feed: FeedBundle,
  section: MobileLayoutSection,
  screen: LayoutScreen,
): number {
  return findResolvedSection(feed, screen, section)?.overflowCount ?? 0;
}

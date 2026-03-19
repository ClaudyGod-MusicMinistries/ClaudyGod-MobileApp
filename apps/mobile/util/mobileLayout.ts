import type { FeedBundle, FeedCardItem } from '../services/contentService';
import type { MobileAppExperienceConfig } from '../services/userFlowService';

export type MobileLayoutSection = MobileAppExperienceConfig['layout']['homeSections'][number];

const DEFAULT_LAYOUT: MobileAppExperienceConfig['layout'] = {
  homeSections: [
    {
      id: 'claudygod-music',
      title: 'ClaudyGod Music',
      subtitle: 'Featured worship videos and music drops on the mobile dashboard.',
      contentTypes: ['video', 'live'],
      maxItems: 8,
    },
    {
      id: 'claudygod-nuggets-of-truth',
      title: 'ClaudyGod Nuggets of Truth',
      subtitle: 'Daily truth, devotional snippets, and scripture-led moments.',
      contentTypes: ['announcement', 'video'],
      maxItems: 8,
    },
    {
      id: 'claudygod-worship-hour',
      title: 'ClaudyGod Worship Hour',
      subtitle: 'Worship sets, replays, and atmosphere-building collections.',
      contentTypes: ['video', 'playlist', 'live'],
      maxItems: 8,
    },
    {
      id: 'claudygod-messages',
      title: 'ClaudyGod Messages',
      subtitle: 'Teaching, message replays, and ministry updates.',
      contentTypes: ['announcement', 'video'],
      maxItems: 8,
    },
    {
      id: 'claudygod-music-audio',
      title: 'ClaudyGod Music (Audio)',
      subtitle: 'Pure audio releases that should lead straight into the music player.',
      contentTypes: ['audio', 'playlist'],
      maxItems: 10,
    },
  ],
  videoSections: [
    {
      id: 'video-spotlight',
      title: 'Video Spotlight',
      subtitle: 'Hero video placement for the latest visual release.',
      contentTypes: ['video', 'live'],
      maxItems: 6,
    },
    {
      id: 'worship-screen',
      title: 'Worship Screen',
      subtitle: 'Worship-focused videos and replays for the video tab.',
      contentTypes: ['video', 'playlist', 'live'],
      maxItems: 8,
    },
    {
      id: 'message-replays',
      title: 'Message Replays',
      subtitle: 'Teaching and message content curated for easy viewing.',
      contentTypes: ['video', 'announcement'],
      maxItems: 8,
    },
    {
      id: 'live-now',
      title: 'Live Now',
      subtitle: 'Current or recent live sessions available from the video screen.',
      contentTypes: ['live', 'video'],
      maxItems: 8,
    },
  ],
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function itemMatchesType(item: FeedCardItem, type: MobileLayoutSection['contentTypes'][number]): boolean {
  if (type === 'live') {
    return item.type === 'live' || Boolean(item.isLive);
  }

  return item.type === type;
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
  return config?.layout?.homeSections?.length ? config.layout.homeSections : DEFAULT_LAYOUT.homeSections;
}

export function getVideoLayoutSections(config?: MobileAppExperienceConfig | null): MobileLayoutSection[] {
  return config?.layout?.videoSections?.length ? config.layout.videoSections : DEFAULT_LAYOUT.videoSections;
}

export function matchesLayoutSection(item: FeedCardItem, section: MobileLayoutSection): boolean {
  const sectionTokens = new Set([normalizeToken(section.id), normalizeToken(section.title)]);
  return Boolean(
    item.appSections?.some((value) => sectionTokens.has(normalizeToken(value))),
  );
}

export function deriveLayoutSectionItems(feed: FeedBundle, section: MobileLayoutSection): FeedCardItem[] {
  const pool = buildCuratedPool(feed);
  const curated = pool.filter((item) => matchesLayoutSection(item, section));
  if (curated.length > 0) {
    return curated.slice(0, section.maxItems);
  }

  return pool
    .filter((item) => section.contentTypes.some((type) => itemMatchesType(item, type)))
    .slice(0, section.maxItems);
}

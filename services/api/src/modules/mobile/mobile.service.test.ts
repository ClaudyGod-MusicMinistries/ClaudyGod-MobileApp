import { buildLayoutSectionResult, matchesConfiguredSection } from './mobile.service.js';
import type { MobileFeedItem } from './mobile.types.js';

// These operate on plain in-memory arrays with no database access, so they're
// safe to assert without a live Postgres connection (see auth.service.test.ts
// for the same convention).

function makeItem(overrides: Partial<MobileFeedItem> & Pick<MobileFeedItem, 'id'>): MobileFeedItem {
  return {
    title: 'Untitled',
    description: '',
    subtitle: 'ClaudyGod',
    type: 'video',
    imageUrl: null,
    appSections: [],
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const section = {
  id: 'nuggets-of-truth',
  title: 'Nuggets of Truth',
  subtitle: 'Short teachings',
  contentTypes: ['video', 'audio'] as ('audio' | 'video' | 'playlist' | 'announcement' | 'live')[],
  actionLabel: 'See all',
  destinationTab: 'videos' as const,
  maxItems: 2,
};

describe('matchesConfiguredSection', () => {
  it('matches a tag equal to the section id, case-insensitively', () => {
    const item = makeItem({ id: '1', appSections: ['Nuggets-Of-Truth'] });
    expect(matchesConfiguredSection(item, section)).toBe(true);
  });

  it('matches a tag equal to the section title (legacy title-based tagging)', () => {
    const item = makeItem({ id: '1', appSections: ['nuggets of truth'] });
    expect(matchesConfiguredSection(item, section)).toBe(true);
  });

  it('does not match an unrelated tag', () => {
    const item = makeItem({ id: '1', appSections: ['teens'] });
    expect(matchesConfiguredSection(item, section)).toBe(false);
  });
});

describe('buildLayoutSectionResult', () => {
  it('is curated and only returns tagged items when at least one item is tagged into the section', () => {
    const tagged = makeItem({ id: 'tagged', type: 'video', appSections: ['nuggets-of-truth'] });
    const untaggedSameType = makeItem({ id: 'untagged', type: 'video', appSections: [] });
    const result = buildLayoutSectionResult([tagged, untaggedSameType], section);

    expect(result.isCurated).toBe(true);
    expect(result.items.map((i) => i.id)).toEqual(['tagged']);
  });

  it('falls back to a type-based sample and reports isCurated: false when nothing is tagged', () => {
    const matchingType = makeItem({ id: 'a', type: 'video', appSections: [] });
    const wrongType = makeItem({ id: 'b', type: 'playlist', appSections: [] });
    const result = buildLayoutSectionResult([matchingType, wrongType], section);

    expect(result.isCurated).toBe(false);
    expect(result.items.map((i) => i.id)).toEqual(['a']);
  });

  it('caps items at maxItems and reports the remainder as overflowCount', () => {
    const items = ['a', 'b', 'c', 'd'].map((id) =>
      makeItem({ id, type: 'video', appSections: ['nuggets-of-truth'] }),
    );
    const result = buildLayoutSectionResult(items, section);

    expect(result.items).toHaveLength(2);
    expect(result.overflowCount).toBe(2);
  });

  it('excludes ad items from the fallback sample', () => {
    const ad = makeItem({ id: 'ad', type: 'ad', appSections: [] });
    const result = buildLayoutSectionResult([ad], section);

    expect(result.isCurated).toBe(false);
    expect(result.items).toHaveLength(0);
  });
});

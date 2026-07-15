import { cleanFeedText, isValidDuration, formatFeedMeta, dedupeFeedItems, getFeaturedItem, isRedundantSubtitle } from './utils';
import type { FeedCardItem } from '../../services/contentService';

function makeItem(overrides: Partial<FeedCardItem> = {}): FeedCardItem {
  return {
    id: 'item-1',
    title: 'Title',
    subtitle: 'Subtitle',
    description: '',
    duration: '3:45',
    imageUrl: 'https://example.com/image.jpg',
    type: 'audio',
    ...overrides,
  };
}

describe('cleanFeedText', () => {
  it('decodes common HTML entities', () => {
    expect(cleanFeedText('Rock &amp; Worship &quot;Live&quot; &#39;Session&#39;&nbsp;Two')).toBe(
      'Rock & Worship "Live" \'Session\' Two',
    );
  });

  it('trims surrounding whitespace', () => {
    expect(cleanFeedText('  Hello  ')).toBe('Hello');
  });

  it('returns an empty string for null/undefined', () => {
    expect(cleanFeedText(null)).toBe('');
    expect(cleanFeedText(undefined)).toBe('');
  });
});

describe('isValidDuration', () => {
  it('accepts a real duration string', () => {
    expect(isValidDuration('3:45')).toBe(true);
  });

  it('rejects placeholder/zero durations', () => {
    expect(isValidDuration('--:--')).toBe(false);
    expect(isValidDuration('0:00')).toBe(false);
    expect(isValidDuration('00:00')).toBe(false);
  });

  it('rejects empty/nullish values', () => {
    expect(isValidDuration('')).toBe(false);
    expect(isValidDuration('   ')).toBe(false);
    expect(isValidDuration(null)).toBe(false);
    expect(isValidDuration(undefined)).toBe(false);
  });
});

describe('formatFeedMeta', () => {
  it('joins subtitle and a valid duration with a middot', () => {
    expect(formatFeedMeta(makeItem({ subtitle: 'Live worship', duration: '4:20' }))).toBe('Live worship · 4:20');
  });

  it('omits an invalid duration', () => {
    expect(formatFeedMeta(makeItem({ subtitle: 'Live worship', duration: '--:--' }))).toBe('Live worship');
  });

  it('omits an empty subtitle', () => {
    expect(formatFeedMeta(makeItem({ subtitle: '', duration: '4:20' }))).toBe('4:20');
  });
});

describe('isRedundantSubtitle', () => {
  it('flags a subtitle already embedded in the title', () => {
    expect(isRedundantSubtitle('Worship Hour! Day 78 - ClaudyGOD Music & Ministries', 'ClaudyGOD Music & Ministries')).toBe(true);
  });

  it('flags an exact match, case/whitespace-insensitive', () => {
    expect(isRedundantSubtitle('  ClaudyGod  ', 'claudygod')).toBe(true);
  });

  it('treats an empty subtitle as redundant (nothing to show)', () => {
    expect(isRedundantSubtitle('Title', '')).toBe(true);
    expect(isRedundantSubtitle('Title', null)).toBe(true);
  });

  it('does not flag a genuinely distinct subtitle', () => {
    expect(isRedundantSubtitle('Not Be Moved', 'ClaudyGod Music & Ministries')).toBe(false);
  });
});

describe('dedupeFeedItems', () => {
  it('removes items sharing the same mediaUrl', () => {
    const items = [
      makeItem({ id: 'a', mediaUrl: 'https://cdn/x.mp3' }),
      makeItem({ id: 'b', mediaUrl: 'https://cdn/x.mp3' }),
      makeItem({ id: 'c', mediaUrl: 'https://cdn/y.mp3' }),
    ];
    expect(dedupeFeedItems(items).map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('falls back to id when mediaUrl is absent', () => {
    const items = [
      makeItem({ id: 'a', mediaUrl: undefined }),
      makeItem({ id: 'a', mediaUrl: undefined }),
      makeItem({ id: 'b', mediaUrl: undefined }),
    ];
    expect(dedupeFeedItems(items).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('treats a blank mediaUrl the same as absent', () => {
    const items = [
      makeItem({ id: 'a', mediaUrl: '   ' }),
      makeItem({ id: 'a', mediaUrl: '   ' }),
    ];
    expect(dedupeFeedItems(items)).toHaveLength(1);
  });
});

describe('getFeaturedItem', () => {
  it('returns the first titled item from the first non-empty group', () => {
    const result = getFeaturedItem([], [makeItem({ id: 'first' }), makeItem({ id: 'second' })]);
    expect(result?.id).toBe('first');
  });

  it('skips groups whose items lack a title', () => {
    const result = getFeaturedItem([makeItem({ title: '' })], [makeItem({ id: 'valid' })]);
    expect(result?.id).toBe('valid');
  });

  it('returns null when every group is empty or missing', () => {
    expect(getFeaturedItem(null, undefined, [])).toBeNull();
  });
});

import {
  buildPlayerRoute,
  routeParamToString,
  isDirectPlayableVideoUrl,
  isDirectPlayableAudioUrl,
  isHostedVideoUrl,
  isYouTubeAudioItem,
  shouldOpenVideoScreen,
} from './playerRoute';
import { APP_ROUTES } from './appRoutes';
import type { FeedCardItem } from '../services/contentService';

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

describe('routeParamToString', () => {
  it('passes through a plain string', () => {
    expect(routeParamToString('abc')).toBe('abc');
  });

  it('takes the first entry of an array param', () => {
    expect(routeParamToString(['abc', 'def'])).toBe('abc');
  });

  it('passes through undefined', () => {
    expect(routeParamToString(undefined)).toBeUndefined();
  });
});

describe('isHostedVideoUrl', () => {
  it('recognizes known hosted-video domains', () => {
    expect(isHostedVideoUrl('https://youtube.com/watch?v=x')).toBe(true);
    expect(isHostedVideoUrl('https://youtu.be/x')).toBe(true);
    expect(isHostedVideoUrl('https://vimeo.com/123')).toBe(true);
  });

  it('rejects a direct file URL', () => {
    expect(isHostedVideoUrl('https://cdn.example.com/video.mp4')).toBe(false);
  });

  it('rejects an empty/missing url', () => {
    expect(isHostedVideoUrl('')).toBe(false);
    expect(isHostedVideoUrl(undefined)).toBe(false);
  });
});

describe('isDirectPlayableVideoUrl', () => {
  it('accepts a direct mp4 URL', () => {
    expect(isDirectPlayableVideoUrl('https://cdn.example.com/clip.mp4')).toBe(true);
  });

  it('rejects a hosted-platform URL even if https', () => {
    expect(isDirectPlayableVideoUrl('https://youtube.com/watch?v=x')).toBe(false);
  });
});

describe('isDirectPlayableAudioUrl', () => {
  it('accepts a direct mp3 URL', () => {
    expect(isDirectPlayableAudioUrl('https://cdn.example.com/track.mp3')).toBe(true);
  });

  it('rejects a hosted-platform URL', () => {
    expect(isDirectPlayableAudioUrl('https://vimeo.com/123')).toBe(false);
  });
});

describe('isYouTubeAudioItem', () => {
  it('is true only when playAsAudio and youtubeVideoId are both set', () => {
    expect(isYouTubeAudioItem({ playAsAudio: true, youtubeVideoId: 'abc' })).toBe(true);
    expect(isYouTubeAudioItem({ playAsAudio: true, youtubeVideoId: undefined })).toBe(false);
    expect(isYouTubeAudioItem({ playAsAudio: false, youtubeVideoId: 'abc' })).toBe(false);
  });
});

describe('shouldOpenVideoScreen', () => {
  it('keeps YouTube-marked-as-audio items out of the video screen', () => {
    expect(shouldOpenVideoScreen({ type: 'video', mediaUrl: undefined, isLive: false, youtubeVideoId: 'abc', playAsAudio: true })).toBe(false);
  });

  it('sends live and video content types to the video screen', () => {
    expect(shouldOpenVideoScreen({ type: 'video', mediaUrl: undefined, isLive: false })).toBe(true);
    expect(shouldOpenVideoScreen({ type: 'audio', mediaUrl: undefined, isLive: true })).toBe(true);
  });

  it('sends hosted-platform media to the video screen', () => {
    expect(shouldOpenVideoScreen({ type: 'audio', mediaUrl: 'https://youtube.com/watch?v=x', isLive: false })).toBe(true);
  });

  it('keeps direct-playable audio in the audio player', () => {
    expect(shouldOpenVideoScreen({ type: 'audio', mediaUrl: 'https://cdn.example.com/track.mp3', isLive: false })).toBe(false);
  });
});

describe('buildPlayerRoute', () => {
  it('routes live sessions to the live detail screen', () => {
    const route = buildPlayerRoute(makeItem({ id: 'session-1', isLive: true, mediaUrl: 'https://stream/x.m3u8' }));
    expect(route.pathname).toBe(APP_ROUTES.live.detail);
    expect(route.params.sessionId).toBe('session-1');
    expect(route.params.mediaUrl).toBe('https://stream/x.m3u8');
  });

  it('treats a yt:-prefixed live id as a regular playable item, not a live session', () => {
    const route = buildPlayerRoute(makeItem({ id: 'yt:abc', isLive: true, type: 'video', mediaUrl: 'https://youtube.com/watch?v=abc' }));
    expect(route.pathname).toBe(APP_ROUTES.tabs.videos);
  });

  it('routes video content to the videos tab with full metadata params', () => {
    const route = buildPlayerRoute(makeItem({ id: 'v1', type: 'video', mediaUrl: 'https://cdn.example.com/clip.mp4' }));
    expect(route.pathname).toBe(APP_ROUTES.tabs.videos);
    expect(route.params).toMatchObject({ itemId: 'v1', itemType: 'video', mediaUrl: 'https://cdn.example.com/clip.mp4' });
  });

  it('routes audio content to the player tab', () => {
    const route = buildPlayerRoute(makeItem({ id: 'a1', type: 'audio', mediaUrl: 'https://cdn.example.com/track.mp3' }));
    expect(route.pathname).toBe(APP_ROUTES.tabs.player);
  });

  it('omits mediaUrl from params when the item has none', () => {
    const route = buildPlayerRoute(makeItem({ id: 'a2', type: 'audio', mediaUrl: undefined }));
    expect(route.params.mediaUrl).toBeUndefined();
  });
});

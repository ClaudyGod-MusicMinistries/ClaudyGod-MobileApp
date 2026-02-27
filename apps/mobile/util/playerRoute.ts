import type { FeedCardItem } from '../services/contentService';

type PlayerRouteObject = {
  pathname: '/(tabs)/PlaySection';
  params: Record<string, string>;
};

export function buildPlayerRoute(item: FeedCardItem): PlayerRouteObject {
  const params: Record<string, string> = {
    itemId: item.id,
    itemType: item.type,
    title: item.title,
    subtitle: item.subtitle,
    imageUrl: item.imageUrl,
    duration: item.duration,
  };

  if (item.mediaUrl) {
    params.mediaUrl = item.mediaUrl;
  }

  return {
    pathname: '/(tabs)/PlaySection',
    params,
  };
}

export function routeParamToString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function isDirectPlayableVideoUrl(url?: string): boolean {
  if (!url) return false;
  const normalized = url.trim().toLowerCase();
  if (!normalized) return false;

  // Hosted pages (YouTube, Vimeo, etc.) are not directly playable in expo-av without an embed/player integration.
  if (
    normalized.includes('youtube.com') ||
    normalized.includes('youtu.be') ||
    normalized.includes('vimeo.com') ||
    normalized.includes('facebook.com') ||
    normalized.includes('instagram.com') ||
    normalized.includes('tiktok.com')
  ) {
    return false;
  }

  return (
    normalized.includes('m3u8') ||
    normalized.includes('.mp4') ||
    normalized.includes('.mov') ||
    normalized.includes('.webm') ||
    normalized.includes('gtv-videos-bucket') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('http://')
  );
}

export function isDirectPlayableAudioUrl(url?: string): boolean {
  if (!url) return false;
  const normalized = url.trim().toLowerCase();
  if (!normalized) return false;

  if (
    normalized.includes('youtube.com') ||
    normalized.includes('youtu.be') ||
    normalized.includes('vimeo.com') ||
    normalized.includes('facebook.com') ||
    normalized.includes('instagram.com') ||
    normalized.includes('tiktok.com')
  ) {
    return false;
  }

  return (
    normalized.includes('.mp3') ||
    normalized.includes('.m4a') ||
    normalized.includes('.aac') ||
    normalized.includes('.wav') ||
    normalized.includes('.ogg') ||
    normalized.includes('.flac') ||
    normalized.includes('gtv-videos-bucket') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('http://')
  );
}

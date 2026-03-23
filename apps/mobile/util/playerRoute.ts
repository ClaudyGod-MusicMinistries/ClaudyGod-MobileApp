import type { FeedCardItem } from '../services/contentService';
import { APP_ROUTES, type PlayerRoutePath } from './appRoutes';

type PlayerRouteObject = {
  pathname: PlayerRoutePath;
  params: Record<string, string>;
};

export function buildPlayerRoute(item: FeedCardItem): PlayerRouteObject {
  if ((item.isLive || item.type === 'live') && !String(item.id || '').startsWith('yt:')) {
    const params: Record<string, string> = {
      sessionId: item.id,
      title: item.title,
    };
    if (item.mediaUrl) {
      params.mediaUrl = item.mediaUrl;
    }
    return {
      pathname: APP_ROUTES.live.detail,
      params,
    };
  }

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
    pathname: shouldOpenVideoScreen(item) ? APP_ROUTES.tabs.videos : APP_ROUTES.tabs.player,
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

  if (isHostedVideoUrl(url)) {
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

  if (isHostedVideoUrl(url)) {
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

export function isHostedVideoUrl(url?: string): boolean {
  if (!url) return false;
  const normalized = url.trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized.includes('youtube.com') ||
    normalized.includes('youtu.be') ||
    normalized.includes('vimeo.com') ||
    normalized.includes('facebook.com') ||
    normalized.includes('instagram.com') ||
    normalized.includes('tiktok.com')
  );
}

export function shouldOpenVideoScreen(item: Pick<FeedCardItem, 'type' | 'mediaUrl' | 'isLive'>): boolean {
  if (item.isLive || item.type === 'video' || item.type === 'live') {
    return true;
  }

  if (isHostedVideoUrl(item.mediaUrl)) {
    return true;
  }

  if (isDirectPlayableVideoUrl(item.mediaUrl) && !isDirectPlayableAudioUrl(item.mediaUrl)) {
    return true;
  }

  return false;
}

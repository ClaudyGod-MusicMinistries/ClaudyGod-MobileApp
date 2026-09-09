/**
 * Pure mappers between the app's `FeedCardItem` shape and the playback domain.
 *
 * No React, no expo-audio — unit-tested in `metadata.test.ts`. The service and
 * store import these; nothing here touches a player instance.
 */

import type { FeedCardItem } from '../services/contentService';
import { isDirectPlayableAudioUrl, isHostedVideoUrl } from '../util/playerRoute';
import type { PlaybackItem, PlaybackSource } from './types';

export interface AudioMetadata {
  title: string;
  artist?: string;
  albumTitle?: string;
  artworkUrl?: string;
}

/** `"3:45"` / `"1:02:33"` → milliseconds. Empty / unparseable → `undefined`. */
export function parseDurationToMs(value: string | undefined | null): number | undefined {
  if (!value) return undefined;
  const parts = value.trim().split(':').map((part) => Number(part));
  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return undefined;
  }
  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  return seconds > 0 ? Math.round(seconds * 1000) : undefined;
}

/** Best-effort YouTube id extraction — only used to tag the engine, not to play. */
export function extractYouTubeVideoId(item: Pick<FeedCardItem, 'id' | 'mediaUrl'>): string | null {
  if (item.id.startsWith('yt:')) return item.id.slice(3) || null;
  const url = item.mediaUrl?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.slice(1) || null;
    if (host.endsWith('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;
      return parsed.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}

function resolveSource(
  item: FeedCardItem,
  downloadUri: string | undefined,
): PlaybackSource | null {
  if (downloadUri) return { kind: 'download', uri: downloadUri };
  if (isHostedVideoUrl(item.mediaUrl)) {
    const videoId = extractYouTubeVideoId(item);
    return videoId ? { kind: 'youtube', videoId } : null;
  }
  if (item.mediaUrl && isDirectPlayableAudioUrl(item.mediaUrl)) {
    return { kind: 'stream', uri: item.mediaUrl };
  }
  return null;
}

export interface FeedItemToPlaybackItemOptions {
  /** Local `file://` URI when the item has been downloaded for offline use. */
  downloadUri?: string;
}

/**
 * Map a feed card to a `PlaybackItem`. Returns `null` when the item has nothing
 * the native audio engine can play (no media URL, or a hosted video without a
 * resolvable id) — callers filter those out of the queue.
 */
export function feedItemToPlaybackItem(
  item: FeedCardItem,
  options: FeedItemToPlaybackItemOptions = {},
): PlaybackItem | null {
  const source = resolveSource(item, options.downloadUri);
  if (!source) return null;

  return {
    id: item.id,
    title: item.title,
    artist: item.subtitle || undefined,
    artworkUrl: item.imageUrl || undefined,
    durationMs: parseDurationToMs(item.duration),
    source,
  };
}

/** Lock-screen / Now Playing metadata for `setActiveForLockScreen`. */
export function playbackItemToMetadata(item: PlaybackItem): AudioMetadata {
  return {
    title: item.title,
    artist: item.artist || 'ClaudyGod',
    albumTitle: 'ClaudyGod',
    artworkUrl: item.artworkUrl,
  };
}

/** The URI to hand expo-audio, or `null` for a YouTube item (played elsewhere). */
export function playbackSourceUri(source: PlaybackSource): string | null {
  return source.kind === 'youtube' ? null : source.uri;
}

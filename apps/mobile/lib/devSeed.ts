/**
 * DEV-ONLY local asset seed.
 *
 * Provides real FeedCardItems backed by local audio files so you can test the
 * player before the backend S3 bucket is configured.
 *
 * Production flow (when S3 is ready):
 *   Admin uploads audio/video → stored in S3 bucket → admin creates a content
 *   record with the S3 public URL as `mediaUrl` → mobile fetches via
 *   GET /v1/mobile/feed → FeedCardItem.mediaUrl points to S3 → AudioPlayer
 *   streams directly from S3 URL.  No local bundling needed.
 *
 * Dev flow (this file):
 *   Assets in assets/audio/ are bundled by Metro (dev builds only).
 *   expo-asset converts the require() number to a file:// URI at runtime.
 *   The file:// URI is used as mediaUrl, which the AudioPlayer accepts.
 *
 * To add a new dev track: drop an .mp3 into assets/audio/ and add an entry
 * to DEV_TRACKS below.
 */

import { Asset } from 'expo-asset';
import type { FeedCardItem } from '../services/contentService';

// Add or remove entries here as you add files to assets/audio/
const DEV_TRACKS: {
  id: string;
  assetModule: number;
  title: string;
  subtitle: string;
  duration: string;
}[] = __DEV__
  ? [
      {
        id: 'dev-not-be-moved',
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        assetModule: require('../assets/audio/not-be-moved.mp3') as number,
        title: 'Not Be Moved',
        subtitle: 'ClaudyGod Music & Ministries',
        duration: '--:--',
      },
    ]
  : [];

let _cached: FeedCardItem[] | null = null;

/**
 * Returns mock FeedCardItems with local file:// URIs as mediaUrl.
 * Safe to call multiple times — resolves the asset once and caches.
 * Always returns [] in production builds.
 */
export async function loadDevFeedItems(): Promise<FeedCardItem[]> {
  if (!__DEV__) return [];
  if (_cached) return _cached;

  const items: FeedCardItem[] = [];

  for (const track of DEV_TRACKS) {
    try {
      const asset = Asset.fromModule(track.assetModule);
      await asset.downloadAsync();
      const uri = asset.localUri ?? '';
      if (!uri) continue;

      items.push({
        id: track.id,
        type: 'audio',
        title: track.title,
        subtitle: track.subtitle,
        description: 'Local dev asset — replace with S3-backed content in production.',
        duration: track.duration,
        imageUrl: '',
        mediaUrl: uri,
        appSections: ['music', 'audio'],
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Asset failed to load — skip silently so the app still boots
    }
  }

  _cached = items;
  return items;
}

/** Reset cache (useful if you hot-reload and want fresh URIs). */
export function clearDevSeedCache() {
  _cached = null;
}

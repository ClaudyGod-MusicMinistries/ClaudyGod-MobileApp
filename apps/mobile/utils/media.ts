/**
 * Utility functions for media operations
 */

/**
 * Format seconds to MM:SS or H:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const padZero = (num: number) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${padZero(minutes)}:${padZero(secs)}`;
  }
  return `${minutes}:${padZero(secs)}`;
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate total duration of tracks
 */
export function calculatePlaylistDuration(durations: number[]): number {
  return durations.reduce((sum, duration) => sum + duration, 0);
}

/**
 * Format date to human readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffTime / (1000 * 60));
      return diffMins === 0 ? 'Just now' : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}w ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Shuffle array in place using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get optimal streaming quality based on connection
 */
export function getOptimalQuality(
  networkSpeed: 'wifi' | 'cellular' | 'slow' | 'unknown'
): 'high' | 'medium' | 'low' {
  switch (networkSpeed) {
    case 'wifi':
      return 'high';
    case 'cellular':
      return 'medium';
    case 'slow':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Get bitrate for quality level
 */
export function getBitrate(quality: 'high' | 'medium' | 'low'): string {
  const bitrateMap = {
    high: '320kbps',
    medium: '192kbps',
    low: '128kbps',
  };
  return bitrateMap[quality];
}

/**
 * Check if track is playable
 */
export function isTrackPlayable(track: any): boolean {
  return !!(track && (track.streamUrl || track.localPath));
}

/**
 * Sanitize track title for display
 */
export function sanitizeTrackTitle(title: string): string {
  return title
    .replace(/\[.*?\]/g, '') // Remove brackets content
    .replace(/\(.*?[Ff]eat\.?.*?\)/g, '') // Remove feature info
    .trim();
}

/**
 * Get playlist play time in human readable format
 */
export function getPlaylistPlayTime(totalDuration: number): string {
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculate progress percentage
 */
export function getProgressPercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

/**
 * Format play count to human readable format
 */
export function formatPlayCount(count: number): string {
  if (count < 1000) return String(count);
  if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
  return (count / 1000000).toFixed(1) + 'M';
}

/**
 * Generate unique ID for queue item
 */
export function generateQueueItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if two tracks are the same
 */
export function areTracksEqual(track1: any, track2: any): boolean {
  return track1?.id === track2?.id;
}

/**
 * Get default cover image for track
 */
export function getDefaultTrackCover(initials: string): string {
  // This could return a placeholder or generate one
  return `https://api.dicebear.com/7.x/initials/svg?seed=${initials}`;
}

/**
 * Validate stream URL
 */
export function isValidStreamUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get time remaining until end of track
 */
export function getTimeRemaining(currentTime: number, duration: number): number {
  return Math.max(0, duration - currentTime);
}

/**
 * Format analytics data
 */
export function formatAnalytics(data: {
  plays: number;
  likes: number;
  shares: number;
}): string {
  return `${formatPlayCount(data.plays)} plays • ${formatPlayCount(data.likes)} likes • ${formatPlayCount(data.shares)} shares`;
}

import { describe, expect, it } from 'vitest';

import type { FeedCardItem } from '../services/contentService';
import {
  extractYouTubeVideoId,
  feedItemToPlaybackItem,
  parseDurationToMs,
  playbackItemToMetadata,
  playbackSourceUri,
} from './metadata';

const card = (overrides: Partial<FeedCardItem>): FeedCardItem => ({
  id: 'c1',
  title: 'Amazing Grace',
  subtitle: 'ClaudyGod',
  description: '',
  duration: '3:30',
  imageUrl: 'https://cdn.example/art.jpg',
  type: 'audio',
  ...overrides,
});

describe('parseDurationToMs', () => {
  it('parses mm:ss', () => expect(parseDurationToMs('3:30')).toBe(210_000));
  it('parses hh:mm:ss', () => expect(parseDurationToMs('1:02:03')).toBe(3_723_000));
  it('returns undefined for empty / bad input', () => {
    expect(parseDurationToMs('')).toBeUndefined();
    expect(parseDurationToMs(undefined)).toBeUndefined();
    expect(parseDurationToMs('abc')).toBeUndefined();
    expect(parseDurationToMs('0:00')).toBeUndefined();
  });
});

describe('extractYouTubeVideoId', () => {
  it('reads the yt: id prefix', () =>
    expect(extractYouTubeVideoId({ id: 'yt:abc123', mediaUrl: undefined })).toBe('abc123'));
  it('reads ?v= and youtu.be', () => {
    expect(extractYouTubeVideoId({ id: 'c', mediaUrl: 'https://www.youtube.com/watch?v=XYZ' })).toBe('XYZ');
    expect(extractYouTubeVideoId({ id: 'c', mediaUrl: 'https://youtu.be/ABC' })).toBe('ABC');
  });
  it('returns null for non-YouTube', () =>
    expect(extractYouTubeVideoId({ id: 'c', mediaUrl: 'https://cdn.example/a.mp3' })).toBeNull());
});

describe('feedItemToPlaybackItem', () => {
  it('maps a streamable audio card', () => {
    const result = feedItemToPlaybackItem(card({ mediaUrl: 'https://cdn.example/grace.mp3' }));
    expect(result).toEqual({
      id: 'c1',
      title: 'Amazing Grace',
      artist: 'ClaudyGod',
      artworkUrl: 'https://cdn.example/art.jpg',
      durationMs: 210_000,
      source: { kind: 'stream', uri: 'https://cdn.example/grace.mp3' },
    });
  });

  it('prefers a download URI when provided', () => {
    const result = feedItemToPlaybackItem(
      card({ mediaUrl: 'https://cdn.example/grace.mp3' }),
      { downloadUri: 'file:///local/grace.mp3' },
    );
    expect(result?.source).toEqual({ kind: 'download', uri: 'file:///local/grace.mp3' });
  });

  it('maps a YouTube card to the youtube source', () => {
    const result = feedItemToPlaybackItem(
      card({ mediaUrl: 'https://www.youtube.com/watch?v=XYZ', type: 'video' }),
    );
    expect(result?.source).toEqual({ kind: 'youtube', videoId: 'XYZ' });
  });

  it('returns null when there is nothing playable', () => {
    expect(feedItemToPlaybackItem(card({ mediaUrl: undefined }))).toBeNull();
  });
});

describe('playbackItemToMetadata', () => {
  it('falls back to the ClaudyGod artist', () => {
    const meta = playbackItemToMetadata({
      id: 'c1',
      title: 'Song',
      source: { kind: 'stream', uri: 'https://cdn.example/s.mp3' },
    });
    expect(meta).toEqual({
      title: 'Song',
      artist: 'ClaudyGod',
      albumTitle: 'ClaudyGod',
      artworkUrl: undefined,
    });
  });
});

describe('playbackSourceUri', () => {
  it('returns the uri for stream/download and null for youtube', () => {
    expect(playbackSourceUri({ kind: 'stream', uri: 'u' })).toBe('u');
    expect(playbackSourceUri({ kind: 'download', uri: 'f' })).toBe('f');
    expect(playbackSourceUri({ kind: 'youtube', videoId: 'v' })).toBeNull();
  });
});

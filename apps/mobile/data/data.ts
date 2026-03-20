import {
  BRAND_COVER_ASSET,
  BRAND_COVER_URI,
  BRAND_HERO_ASSET,
  BRAND_HERO_URI,
  BRAND_LOGO_URI,
} from '../util/brandAssets';

const playlistImages = [BRAND_COVER_URI, BRAND_HERO_URI, BRAND_LOGO_URI];

const playlistImage = (index: number) => playlistImages[index % playlistImages.length];

export const featuredPlaylists = [
  {
    id: '1',
    title: 'Worship Hour',
    description: 'Featured worship moments curated by ClaudyGod',
    imageUrl: playlistImage(0),
    songCount: 12,
  },
  {
    id: '2',
    title: 'Nuggets of Truth',
    description: 'Scripture-led moments and reflective audio drops',
    imageUrl: playlistImage(1),
    songCount: 15,
  },
  {
    id: '3',
    title: 'Live Sessions',
    description: 'Replays from ministry broadcasts and worship sets',
    imageUrl: playlistImage(2),
    songCount: 10,
  },
];

export const recentSongs = [
  {
    id: '1',
    title: 'You Are Our Everything',
    artist: 'ClaudyGod',
    duration: '4:32',
    album: 'ClaudyGod Worship',
  },
  {
    id: '2',
    title: 'Nuggets of Truth Theme',
    artist: 'ClaudyGod',
    duration: '3:48',
    album: 'Ministry Moments',
  },
];

export const currentSong = {
  id: '1',
  title: 'You Are Our Everything',
  artist: 'ClaudyGod',
  album: 'ClaudyGod Worship',
  duration: '4:32',
  imageUrl: BRAND_COVER_URI,
};

export const favouriteSongs = [
  {
    id: '1',
    title: 'Worship Hour Intro',
    artist: 'ClaudyGod',
    duration: '4:18',
    album: 'Worship Hour',
    imageUrl: BRAND_COVER_URI,
  },
  {
    id: '2',
    title: 'Morning Prayer Atmosphere',
    artist: 'ClaudyGod',
    duration: '5:15',
    album: 'Prayer Sessions',
    imageUrl: BRAND_HERO_URI,
  },
  {
    id: '3',
    title: 'Faith Declaration',
    artist: 'ClaudyGod',
    duration: '3:57',
    album: 'Nuggets of Truth',
    imageUrl: BRAND_LOGO_URI,
  },
];

export const favouritePlaylists = [
  {
    id: '1',
    title: 'Ministry Essentials',
    description: 'Core worship and message content for everyday listening',
    imageUrl: BRAND_COVER_URI,
    songCount: 24,
  },
  {
    id: '2',
    title: 'Prayer Focus',
    description: 'Quiet moments for devotion, prayer, and reflection',
    imageUrl: BRAND_HERO_URI,
    songCount: 18,
  },
  {
    id: '3',
    title: 'Video Replays',
    description: 'Latest ministry videos and live replays',
    imageUrl: BRAND_LOGO_URI,
    songCount: 15,
  },
];

export const recentlyAdded = [
  {
    id: '7',
    title: 'Fresh Worship Release',
    artist: 'ClaudyGod',
    duration: '4:25',
    album: 'Latest Release',
    imageUrl: BRAND_COVER_URI,
    addedDate: '2026-03-20',
  },
  {
    id: '8',
    title: 'Evening Reflection',
    artist: 'ClaudyGod',
    duration: '4:12',
    album: 'Prayer Sessions',
    imageUrl: BRAND_HERO_URI,
    addedDate: '2026-03-19',
  },
  {
    id: '9',
    title: 'Daily Truth',
    artist: 'ClaudyGod',
    duration: '5:43',
    album: 'Nuggets of Truth',
    imageUrl: BRAND_LOGO_URI,
    addedDate: '2026-03-18',
  },
];
export const defaultSlides = [
  {
    id: '1',
    title: 'ClaudyGod Worship',
    subtitle: 'A single home for worship, messages, and devotionals',
    description: 'Stay connected to new releases, live sessions, and daily encouragement from the ministry.',
    backgroundImage: BRAND_COVER_ASSET,
    ctaText: 'Explore now',
  },
  {
    id: '2',
    title: 'Ministry Live',
    subtitle: 'Watch replays and live worship sessions',
    description: 'Follow the latest worship broadcasts, message replays, and ministry updates across every screen.',
    backgroundImage: BRAND_HERO_ASSET,
  },
];

export const recentSearches = [
  "Worship Songs 2024",
  "Gospel Mix",
  "Prayer Music",
  "African Praise"
];

export const searchCategories = [
  { id: '1', name: 'Worship' },
  { id: '2', name: 'Gospel' },
  { id: '3', name: 'Prayer' },
  { id: '4', name: 'Meditation' },
  { id: '5', name: 'Praise' },
  { id: '6', name: 'African' },
];

export const featuredVideos = [
  {
    id: 'v1',
    title: 'Latest Worship Replay',
  },
  {
    id: 'v2',
    title: 'Ministry Message Replay',
  },
  {
    id: 'v3',
    title: 'Prayer and Encouragement',
  },
];

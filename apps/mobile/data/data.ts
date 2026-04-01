export type PlaylistSummary = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  songCount?: number;
};

export type SongSummary = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  album: string;
  imageUrl?: string;
  addedDate?: string;
};

export type SlideSummary = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string | number;
  ctaText?: string;
};

export const featuredPlaylists: PlaylistSummary[] = [];
export const recentSongs: SongSummary[] = [];
export const currentSong: SongSummary | null = null;
export const favouriteSongs: SongSummary[] = [];
export const favouritePlaylists: PlaylistSummary[] = [];
export const recentlyAdded: SongSummary[] = [];
export const defaultSlides: SlideSummary[] = [];
export const recentSearches: string[] = [];
export const searchCategories: { id: string; name: string }[] = [];
export const featuredVideos: { id: string; title: string }[] = [];

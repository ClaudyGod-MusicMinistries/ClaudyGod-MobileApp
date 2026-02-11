import { apiFetch } from './apiClient';
import { ApiResponse, MediaItem } from './types';

export const fetchFeaturedMedia = () => apiFetch<ApiResponse<MediaItem>>('/media/featured');
export const fetchTrendingMedia = () => apiFetch<ApiResponse<MediaItem>>('/media/trending');
export const fetchPlaylists = () => apiFetch<ApiResponse<MediaItem>>('/media/playlists');

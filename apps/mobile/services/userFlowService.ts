import { apiFetch } from './apiClient';
import { getStoredMobileSession } from './authService';

type JsonRecord = Record<string, unknown>;

async function apiFetchAuthed<T>(path: string, init?: RequestInit): Promise<T> {
  const { accessToken } = await getStoredMobileSession();
  if (!accessToken) {
    throw new Error('Sign in required');
  }

  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export interface MeProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'CLIENT' | 'ADMIN';
  avatarUrl?: string;
  phone?: string;
  country?: string;
  locale?: string;
  timezone?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MePreferences {
  notificationsEnabled: boolean;
  autoplayEnabled: boolean;
  highQualityEnabled: boolean;
  diagnosticsEnabled: boolean;
  personalizationEnabled: boolean;
  themePreference: 'system' | 'light' | 'dark';
  updatedAt: string;
}

export interface MeMetrics {
  email: string;
  displayName: string;
  totalPlays: number;
  liveSubscriptions: number;
}

export interface MobileAppExperienceConfig {
  version: number;
  privacy: {
    contactEmail: string;
    deleteConfirmPhrase: string;
    principles: string[];
  };
  help: {
    supportCenterUrl: string;
    contact: {
      id: string;
      icon: string;
      title: string;
      desc: string;
      actionUrl: string;
    }[];
    faqs: {
      id: string;
      q: string;
      a: string;
    }[];
  };
  about: {
    heroStats: { label: string; value: string }[];
    featureChips: { icon: string; label: string }[];
    team: { name: string; role: string; desc: string }[];
    social: { icon: string; label: string; url: string }[];
    versionLabel: string;
  };
  donate: {
    currency: string;
    quickAmounts: string[];
    methods: {
      id: string;
      icon: string;
      label: string;
      subtitle: string;
      badge?: string;
    }[];
    plans: {
      id: string;
      name: string;
      amount: string;
      period: 'once' | 'monthly';
      note: string;
      featured?: boolean;
      icon: string;
    }[];
    impactBreakdown: { label: string; value: number; icon: string }[];
  };
  rate: {
    iosStoreUrl: string;
    androidStoreUrl: string;
    feedbackRoute: string;
  };
}

export interface MeLibraryItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad';
  imageUrl?: string;
  mediaUrl?: string;
  duration?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeLibrary {
  liked: MeLibraryItem[];
  downloaded: MeLibraryItem[];
  playlists: { name: string; items: MeLibraryItem[] }[];
}

export async function fetchMobileAppConfig(): Promise<{
  config: MobileAppExperienceConfig;
  meta: { key: string; updatedAt: string };
}> {
  return apiFetch('/v1/mobile/app/config');
}

export async function fetchMeBootstrap(): Promise<{
  profile: MeProfile;
  preferences: MePreferences;
  metrics: MeMetrics;
  privacy: {
    totalRequests: number;
    latestRequests: { id: string; type: 'export' | 'delete'; status: string; createdAt: string }[];
    totalPlayEvents: number;
    totalLiveSubscriptions: number;
  };
  library: MeLibrary;
}> {
  return apiFetchAuthed('/v1/me/bootstrap');
}

export async function fetchMeProfile(): Promise<{ user: MeProfile }> {
  return apiFetchAuthed('/v1/me/profile');
}

export async function updateMeProfile(input: Partial<Omit<MeProfile, 'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'>>): Promise<{ user: MeProfile }> {
  return apiFetchAuthed('/v1/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function fetchMePreferences(): Promise<{ preferences: MePreferences }> {
  return apiFetchAuthed('/v1/me/preferences');
}

export async function updateMePreferences(input: Partial<MePreferences>): Promise<{ preferences: MePreferences }> {
  const payload: Partial<MePreferences> = { ...input };
  delete (payload as Partial<MePreferences>).updatedAt;
  return apiFetchAuthed('/v1/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchMeMetrics(): Promise<MeMetrics> {
  return apiFetchAuthed('/v1/me/metrics');
}

export async function fetchMeLibrary(): Promise<MeLibrary> {
  return apiFetchAuthed('/v1/me/library');
}

export async function saveMeLibraryItem(input: {
  bucket: 'liked' | 'downloaded' | 'playlist';
  playlistName?: string;
  contentId: string;
  contentType: 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad';
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  mediaUrl?: string;
  duration?: string;
  metadata?: JsonRecord;
}): Promise<{ saved: true }> {
  return apiFetchAuthed('/v1/me/library/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function removeMeLibraryItem(input: {
  bucket: 'liked' | 'downloaded' | 'playlist';
  contentId: string;
  playlistName?: string;
}): Promise<{ removed: boolean }> {
  return apiFetchAuthed('/v1/me/library/items', {
    method: 'DELETE',
    body: JSON.stringify(input),
  });
}

export async function trackMePlayEvent(input: {
  contentId: string;
  contentType: 'audio' | 'video' | 'playlist' | 'announcement' | 'live' | 'ad';
  title: string;
  source?: string;
  metadata?: JsonRecord;
}): Promise<void> {
  await apiFetchAuthed('/v1/me/engagement/play-events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function subscribeToLiveAlertsBackend(channelId: string, label?: string): Promise<void> {
  await apiFetchAuthed('/v1/me/engagement/live-subscriptions', {
    method: 'POST',
    body: JSON.stringify({ channelId, label }),
  });
}

export async function fetchMePrivacyOverview() {
  return apiFetchAuthed<{
    privacy: {
      totalRequests: number;
      latestRequests: { id: string; type: 'export' | 'delete'; status: string; createdAt: string }[];
      totalPlayEvents: number;
      totalLiveSubscriptions: number;
    };
  }>('/v1/me/privacy');
}

export async function requestPrivacyDataExport(notes?: string) {
  return apiFetchAuthed<{
    request: { id: string; type: 'export'; status: string; createdAt: string };
  }>('/v1/me/privacy/export-request', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function requestPrivacyDeleteAccount(input: {
  fullName: string;
  confirmText: string;
  notes?: string;
}) {
  return apiFetchAuthed<{
    request: { id: string; type: 'delete'; status: string; createdAt: string };
  }>('/v1/me/privacy/delete-request', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function resetRecommendationHistory() {
  return apiFetchAuthed<{ clearedPlayEvents: number }>('/v1/me/privacy/reset-history', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function createSupportRequest(input: {
  category: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: JsonRecord;
}) {
  return apiFetchAuthed<{
    ticket: { id: string; status: string; createdAt: string };
  }>('/v1/me/support-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function createAppRating(input: {
  rating: number;
  comment?: string;
  channel?: 'mobile' | 'admin' | 'web';
  metadata?: JsonRecord;
}) {
  return apiFetchAuthed<{
    rating: { id: string; value: number; createdAt: string };
  }>('/v1/me/ratings', {
    method: 'POST',
    body: JSON.stringify({ channel: 'mobile', ...input }),
  });
}

export async function createDonationIntent(input: {
  amount: string;
  mode: 'once' | 'monthly';
  methodId: string;
  currency?: string;
  planId?: string;
  metadata?: JsonRecord;
}) {
  return apiFetchAuthed<{
    donationIntent: {
      id: string;
      status: string;
      amountCents: number;
      currency: string;
      mode: 'once' | 'monthly';
      methodId: string;
      createdAt: string;
    };
  }>('/v1/me/donation-intents', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

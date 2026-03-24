import { Platform } from 'react-native';
import { apiFetch } from './apiClient';
import { getStoredMobileSession } from './authService';

async function apiFetchAuthed<T>(path: string, init?: RequestInit): Promise<T> {
  if (Platform.OS === 'web') {
    return apiFetch<T>(path, init);
  }

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

export type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type LiveMessageKind = 'comment' | 'suggestion';

export interface LiveSessionMessage {
  id: string;
  liveSessionId: string;
  kind: LiveMessageKind;
  visibility: 'visible' | 'hidden';
  message: string;
  createdAt: string;
  updatedAt?: string;
  author: {
    id?: string;
    displayName: string;
    email?: string;
    role?: 'CLIENT' | 'ADMIN';
  };
}

export interface LiveSessionDetail {
  id: string;
  title: string;
  description: string;
  status: LiveSessionStatus;
  channelId: string;
  coverImageUrl?: string;
  streamUrl?: string;
  playbackUrl?: string;
  scheduledFor?: string;
  startedAt?: string;
  endedAt?: string;
  notifySubscribers: boolean;
  viewerCount: number;
  tags: string[];
  appSections: string[];
  metadata: Record<string, unknown>;
  messageCount: number;
  latestMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id?: string;
    displayName: string;
    email?: string;
    role?: 'CLIENT' | 'ADMIN';
  };
  updatedBy?: {
    id?: string;
    displayName: string;
    email?: string;
    role?: 'CLIENT' | 'ADMIN';
  };
  messages: LiveSessionMessage[];
}

export interface LiveSessionSummary {
  id: string;
  title: string;
  description: string;
  status: LiveSessionStatus;
  channelId: string;
  coverImageUrl?: string;
  streamUrl?: string;
  playbackUrl?: string;
  scheduledFor?: string;
  startedAt?: string;
  endedAt?: string;
  notifySubscribers: boolean;
  viewerCount: number;
  tags: string[];
  appSections: string[];
  metadata: Record<string, unknown>;
  messageCount: number;
  latestMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id?: string;
    displayName: string;
    email?: string;
    role?: 'CLIENT' | 'ADMIN';
  };
  updatedBy?: {
    id?: string;
    displayName: string;
    email?: string;
    role?: 'CLIENT' | 'ADMIN';
  };
}

export async function fetchLiveSessions(scope: 'all' | 'live' | 'upcoming' | 'archive' = 'all'): Promise<{
  items: LiveSessionSummary[];
}> {
  const query = new URLSearchParams({ scope });
  return apiFetch(`/v1/live/sessions?${query.toString()}`);
}

export async function fetchLiveSessionDetail(sessionId: string): Promise<LiveSessionDetail> {
  return apiFetch(`/v1/live/sessions/${encodeURIComponent(sessionId)}`);
}

export async function postLiveSessionMessage(
  sessionId: string,
  input: {
    kind: LiveMessageKind;
    message: string;
  },
): Promise<LiveSessionMessage> {
  return apiFetchAuthed(`/v1/live/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

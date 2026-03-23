import type { UserRole } from '../auth/auth.types';

export type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type LiveMessageKind = 'comment' | 'suggestion';
export type LiveMessageVisibility = 'visible' | 'hidden';

export interface LiveActor {
  id?: string;
  displayName: string;
  email?: string;
  role?: UserRole;
}

export interface LiveSession {
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
  createdBy?: LiveActor;
  updatedBy?: LiveActor;
}

export interface LiveMessage {
  id: string;
  liveSessionId: string;
  kind: LiveMessageKind;
  message: string;
  visibility: LiveMessageVisibility;
  createdAt: string;
  updatedAt?: string;
  author: LiveActor;
}

export interface LiveSessionDetail extends LiveSession {
  messages: LiveMessage[];
}

export interface CreateLiveSessionInput {
  title: string;
  description: string;
  channelId?: string;
  coverImageUrl?: string;
  streamUrl?: string;
  playbackUrl?: string;
  scheduledFor?: string;
  notifySubscribers?: boolean;
  viewerCount?: number;
  tags?: string[];
  appSections?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateLiveSessionInput {
  title?: string;
  description?: string;
  status?: LiveSessionStatus;
  channelId?: string;
  coverImageUrl?: string;
  streamUrl?: string;
  playbackUrl?: string;
  scheduledFor?: string;
  notifySubscribers?: boolean;
  viewerCount?: number;
  tags?: string[];
  appSections?: string[];
  metadata?: Record<string, unknown>;
}

export interface EndLiveSessionInput {
  playbackUrl?: string;
  viewerCount?: number;
}

export interface CreateLiveMessageInput {
  kind: LiveMessageKind;
  message: string;
}

export interface ListLiveSessionsQuery {
  scope?: 'all' | 'live' | 'upcoming' | 'archive';
}

// database/models/Notification.ts
/**
 * Notification Interface
 * Database model for user notifications and activity feed
 */

export interface Notification {
  id: string;
  userId: string;

  // Source of notification
  actorId?: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'system' | 'verification';

  // Notification content
  title: string;
  message?: string;

  // Related resource
  relatedEntityId?: string;
  relatedEntityType?: string;

  // Notification status
  isRead: boolean;
  readAt?: Date;
  isArchived: boolean;

  // Notification action
  actionUrl?: string;
  data: Record<string, any>;

  // Notification delivery channels
  inAppNotification: boolean;
  emailNotification: boolean;
  pushNotification: boolean;
  emailSentAt?: Date;
  pushSentAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

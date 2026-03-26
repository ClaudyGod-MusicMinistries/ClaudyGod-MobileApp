// database/models/Content.ts
/**
 * Content Interface
 * Database model for user-generated content (posts, music, etc.)
 */

export interface Content {
  id: string;
  userId: string;

  // Content metadata
  title: string;
  description?: string;
  type: 'post' | 'music' | 'video' | 'image' | 'article';
  coverImageUrl?: string;
  thumbnailUrl?: string;

  // Content status
  status: 'draft' | 'published' | 'archived' | 'deleted';
  isFeatured: boolean;

  // Media information
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  duration?: number;

  // Engagement metrics
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;

  // Tags and categories
  tags: string[];
  category?: string;

  // Visibility
  visibility: 'public' | 'private' | 'friends' | 'followers';

  // Content metadata
  metadata: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  deletedAt?: Date;
}

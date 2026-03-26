// database/models/Content.ts
/**
 * Content Entity
 * Database model for user-generated content (posts, music, etc.)
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('content')
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  // Content metadata
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50 })
  type!: 'post' | 'music' | 'video' | 'image' | 'article';

  @Column({ type: 'varchar', length: 255, nullable: true })
  coverImageUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnailUrl?: string;

  // Content status
  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: 'draft' | 'published' | 'archived' | 'deleted';

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  // Media information
  @Column({ type: 'varchar', length: 255, nullable: true })
  mediaUrl?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mediaType?: string;

  @Column({ type: 'bigint', nullable: true })
  mediaSize?: number;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  // Engagement metrics
  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'int', default: 0 })
  likeCount!: number;

  @Column({ type: 'int', default: 0 })
  commentCount!: number;

  @Column({ type: 'int', default: 0 })
  shareCount!: number;

  // Tags and categories
  @Column({ type: 'json', default: () => "'[]'" })
  tags!: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  // Visibility
  @Column({ type: 'varchar', length: 20, default: 'public' })
  visibility!: 'public' | 'private' | 'friends' | 'followers';

  // Content metadata
  @Column({ type: 'json', default: () => "'{}'" })
  metadata!: Record<string, any>;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}

// database/models/Notification.ts
/**
 * Notification Entity
 * Database model for user notifications and activity feed
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('notifications')
@Index(['userId'])
@Index(['isRead'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  // Source of notification
  @Column({ type: 'uuid', nullable: true })
  actorId?: string;

  @Column({ type: 'varchar', length: 50 })
  type!: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'system' | 'verification';

  // Notification content
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  // Related resource
  @Column({ type: 'uuid', nullable: true })
  relatedEntityId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedEntityType?: string;

  // Notification status
  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  // Notification action
  @Column({ type: 'varchar', length: 255, nullable: true })
  actionUrl?: string;

  @Column({ type: 'json', default: () => "'{}'" })
  data!: Record<string, any>;

  // Notification delivery channels
  @Column({ type: 'boolean', default: true })
  inAppNotification!: boolean;

  @Column({ type: 'boolean', default: true })
  emailNotification!: boolean;

  @Column({ type: 'boolean', default: false })
  pushNotification!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailSentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  pushSentAt?: Date;

  // Timestamps
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;
}

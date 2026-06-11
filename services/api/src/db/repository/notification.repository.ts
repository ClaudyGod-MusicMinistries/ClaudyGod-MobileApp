import type { Pool } from 'pg';
import type { Notification } from '../../database/models/Notification';
import { BaseRepository } from './base';

export class NotificationRepository extends BaseRepository<Notification> {
  constructor(pool: Pool) {
    super(pool, 'notifications');
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
    return this.query<Notification>({
      text: `SELECT * FROM "notifications" WHERE user_id = $1 AND is_archived = false AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      values: [userId, limit, offset],
    });
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return this.query<Notification>({
      text: `SELECT * FROM "notifications" WHERE user_id = $1 AND is_read = false AND is_archived = false AND deleted_at IS NULL ORDER BY created_at DESC`,
      values: [userId],
    });
  }

  async countUnread(userId: string): Promise<number> {
    const rows = await this.query<{ count: number }>({
      text: `SELECT COUNT(*)::int AS count FROM "notifications" WHERE user_id = $1 AND is_read = false AND is_archived = false AND deleted_at IS NULL`,
      values: [userId],
    });
    return rows[0]?.count ?? 0;
  }

  async markRead(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE "notifications" SET is_read = true, read_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
  }

  async markAllReadForUser(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE "notifications" SET is_read = true, read_at = NOW(), updated_at = NOW() WHERE user_id = $1 AND is_read = false AND deleted_at IS NULL`,
      [userId],
    );
  }

  async archive(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE "notifications" SET is_archived = true, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM "notifications" WHERE expires_at IS NOT NULL AND expires_at < NOW()`,
    );
    return result.rowCount ?? 0;
  }
}

import type { Pool } from 'pg';
import type { Content } from '../../database/models/Content';
import { BaseRepository } from './base';

export class ContentRepository extends BaseRepository<Content> {
  constructor(pool: Pool) {
    super(pool, 'content');
  }

  async findPublished(limit = 50, offset = 0): Promise<Content[]> {
    return this.query<Content>({
      text: `SELECT * FROM "content" WHERE status = 'published' AND visibility = 'public' AND deleted_at IS NULL ORDER BY published_at DESC LIMIT $1 OFFSET $2`,
      values: [limit, offset],
    });
  }

  async findFeatured(limit = 10): Promise<Content[]> {
    return this.query<Content>({
      text: `SELECT * FROM "content" WHERE is_featured = true AND status = 'published' AND deleted_at IS NULL ORDER BY published_at DESC LIMIT $1`,
      values: [limit],
    });
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Content[]> {
    return this.query<Content>({
      text: `SELECT * FROM "content" WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      values: [userId, limit, offset],
    });
  }

  async findByType(type: Content['type'], limit = 50, offset = 0): Promise<Content[]> {
    return this.query<Content>({
      text: `SELECT * FROM "content" WHERE type = $1 AND status = 'published' AND deleted_at IS NULL ORDER BY published_at DESC LIMIT $2 OFFSET $3`,
      values: [type, limit, offset],
    });
  }

  async findByCategory(category: string, limit = 50, offset = 0): Promise<Content[]> {
    return this.query<Content>({
      text: `SELECT * FROM "content" WHERE category = $1 AND status = 'published' AND deleted_at IS NULL ORDER BY published_at DESC LIMIT $2 OFFSET $3`,
      values: [category, limit, offset],
    });
  }

  async search(query: string, limit = 20): Promise<Content[]> {
    return this.query<Content>({
      text: `SELECT * FROM "content" WHERE (title ILIKE $1 OR description ILIKE $1) AND status = 'published' AND deleted_at IS NULL ORDER BY published_at DESC LIMIT $2`,
      values: [`%${query}%`, limit],
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE "content" SET view_count = view_count + 1 WHERE id = $1`,
      [id],
    );
  }

  async publish(id: string): Promise<Content | null> {
    const rows = await this.query<Content>({
      text: `UPDATE "content" SET status = 'published', published_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      values: [id],
    });
    return rows[0] ?? null;
  }
}

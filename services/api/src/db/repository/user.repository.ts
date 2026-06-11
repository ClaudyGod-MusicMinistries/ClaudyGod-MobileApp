import type { Pool } from 'pg';
import type { User } from '../../database/models/User';
import { BaseRepository } from './base';

export class UserRepository extends BaseRepository<User> {
  constructor(pool: Pool) {
    super(pool, 'users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.query<User>({
      text: `SELECT * FROM "users" WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      values: [email.toLowerCase()],
    });
    return rows[0] ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.query<User>({
      text: `SELECT * FROM "users" WHERE username = $1 AND deleted_at IS NULL LIMIT 1`,
      values: [username],
    });
    return rows[0] ?? null;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    const rows = await this.query<User>({
      text: `SELECT * FROM "users" WHERE verification_token = $1 AND deleted_at IS NULL LIMIT 1`,
      values: [token],
    });
    return rows[0] ?? null;
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const rows = await this.query<User>({
      text: `SELECT * FROM "users" WHERE password_reset_token = $1 AND password_reset_token_expiry > NOW() AND deleted_at IS NULL LIMIT 1`,
      values: [token],
    });
    return rows[0] ?? null;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE "users" SET last_login_at = NOW(), login_count = login_count + 1, updated_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async findActiveAdmins(): Promise<User[]> {
    return this.query<User>({
      text: `SELECT * FROM "users" WHERE is_admin = true AND is_active = true AND deleted_at IS NULL ORDER BY created_at ASC`,
      values: [],
    });
  }
}

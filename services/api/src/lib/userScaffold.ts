import type { PoolClient } from 'pg';
import { pool } from '../db/pool';

interface QueryRunner {
  query: PoolClient['query'];
}

export const ensureUserScaffold = async (
  userId: string,
  displayName: string,
  email: string,
  runner: QueryRunner = pool,
): Promise<void> => {
  await Promise.all([
    runner.query(
      `INSERT INTO user_profiles (user_id, display_name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           updated_at = NOW()`,
      [userId, displayName, email],
    ),
    runner.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    ),
  ]);
};

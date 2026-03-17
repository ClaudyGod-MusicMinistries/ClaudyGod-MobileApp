import type { PoolClient } from 'pg';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { supabaseAdmin } from '../../infra/supabase';
import type { JwtClaims } from '../../utils/jwt';
import { verifyAccessToken } from '../../utils/jwt';
import type { UserRole } from './auth.types';

interface AppUserRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
}

const inferDisplayName = (user: SupabaseUser): string => {
  const metadata = user.user_metadata ?? {};
  const candidate =
    metadata.display_name ??
    metadata.displayName ??
    metadata.full_name ??
    metadata.fullName;

  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }

  if (user.email && user.email.includes('@')) {
    return user.email.split('@')[0]!;
  }

  return 'ClaudyGod User';
};

const ensureUserScaffold = async (
  client: PoolClient,
  userId: string,
  displayName: string,
  email: string,
): Promise<void> => {
  await Promise.all([
    client.query(
      `INSERT INTO user_profiles (user_id, display_name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           updated_at = NOW()`,
      [userId, displayName, email],
    ),
    client.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    ),
  ]);
};

const syncSupabaseUser = async (user: SupabaseUser): Promise<JwtClaims> => {
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    throw new Error('Supabase user email is missing');
  }

  const displayName = inferDisplayName(user);
  const emailVerifiedAt = user.email_confirmed_at ?? null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query<AppUserRow>(
      `SELECT id, email, display_name, role
       FROM app_users
       WHERE supabase_user_id = $1 OR email = $2
       ORDER BY CASE WHEN supabase_user_id = $1 THEN 0 ELSE 1 END
       LIMIT 1`,
      [user.id, email],
    );

    let appUser: AppUserRow;
    if (existing.rowCount && existing.rows[0]) {
      const updated = await client.query<AppUserRow>(
        `UPDATE app_users
         SET
           email = $2,
           display_name = $3,
           email_verified_at = COALESCE($4, email_verified_at),
           auth_provider = 'supabase',
           supabase_user_id = COALESCE(supabase_user_id, $5),
           last_login_at = NOW(),
           updated_at = NOW()
         WHERE id = $1
         RETURNING id, email, display_name, role`,
        [existing.rows[0].id, email, displayName, emailVerifiedAt, user.id],
      );
      appUser = updated.rows[0]!;
    } else {
      const inserted = await client.query<AppUserRow>(
        `INSERT INTO app_users (
           email,
           password_hash,
           display_name,
           role,
           email_verified_at,
           auth_provider,
           supabase_user_id,
           last_login_at
         )
         VALUES ($1, NULL, $2, 'CLIENT', $3, 'supabase', $4, NOW())
         RETURNING id, email, display_name, role`,
        [email, displayName, emailVerifiedAt, user.id],
      );
      appUser = inserted.rows[0]!;
    }

    await ensureUserScaffold(client, appUser.id, appUser.display_name, appUser.email);
    await client.query('COMMIT');

    return {
      sub: appUser.id,
      email: appUser.email,
      role: appUser.role,
      displayName: appUser.display_name,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const resolveAuthenticatedUser = async (token: string): Promise<JwtClaims> => {
  try {
    return verifyAccessToken(token);
  } catch (jwtError) {
    if (!env.SUPABASE_ENABLED || !supabaseAdmin) {
      throw jwtError;
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw jwtError;
    }

    return syncSupabaseUser(user);
  }
};

import { pool } from '../../db/pool';
import { HttpError } from '../../lib/httpError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import type { AuthResponse, LoginInput, RegisterInput, SafeUser, UserRole } from './auth.types';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  created_at: string | Date;
}

interface PublicUserRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string | Date;
}

const toIsoDate = (value: string | Date): string => new Date(value).toISOString();

const toSafeUser = (row: PublicUserRow): SafeUser => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  role: row.role,
  createdAt: toIsoDate(row.created_at),
});

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();

  const existing = await pool.query<{ id: string }>('SELECT id FROM app_users WHERE email = $1 LIMIT 1', [
    email,
  ]);

  if (existing.rowCount && existing.rowCount > 0) {
    throw new HttpError(409, 'Email is already registered');
  }

  const passwordHash = await hashPassword(input.password);

  const result = await pool.query<PublicUserRow>(
    `INSERT INTO app_users (email, password_hash, display_name, role)
     VALUES ($1, $2, $3, 'CLIENT')
     RETURNING id, email, display_name, role, created_at`,
    [email, passwordHash, displayName],
  );

  const user = toSafeUser(result.rows[0]);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  });

  return {
    accessToken,
    user,
  };
};

export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  const email = input.email.trim().toLowerCase();

  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, display_name, role, created_at
     FROM app_users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (result.rowCount === 0) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const userRow = result.rows[0];
  const isValidPassword = await verifyPassword(input.password, userRow.password_hash);

  if (!isValidPassword) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const safeUser = toSafeUser(userRow);
  const accessToken = signAccessToken({
    sub: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
    displayName: safeUser.displayName,
  });

  return {
    accessToken,
    user: safeUser,
  };
};

export const getUserById = async (userId: string): Promise<SafeUser> => {
  const result = await pool.query<PublicUserRow>(
    `SELECT id, email, display_name, role, created_at
     FROM app_users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'User not found');
  }

  return toSafeUser(result.rows[0]);
};

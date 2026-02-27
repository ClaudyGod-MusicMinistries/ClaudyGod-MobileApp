import { env } from '../config/env';
import { runMigrations } from './migrate';
import { closePool, pool } from './pool';
import { hashPassword } from '../utils/password';

const seedAdmin = async (): Promise<void> => {
  await runMigrations();

  const email = env.SEED_ADMIN_EMAIL.trim().toLowerCase();
  const displayName = env.SEED_ADMIN_DISPLAY_NAME.trim();
  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);

  const result = await pool.query<{ id: string; email: string; display_name: string; role: string }>(
    `INSERT INTO app_users (email, password_hash, display_name, role, email_verified_at)
     VALUES ($1, $2, $3, 'ADMIN', NOW())
     ON CONFLICT (email)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       display_name = EXCLUDED.display_name,
       role = 'ADMIN',
       email_verified_at = COALESCE(app_users.email_verified_at, NOW()),
       updated_at = NOW()
     RETURNING id, email, display_name, role`,
    [email, passwordHash, displayName],
  );

  const row = result.rows[0]!;
  console.log(`Admin user seeded: ${row.email} (${row.role}) [${row.id}]`);
};

const run = async (): Promise<void> => {
  try {
    await seedAdmin();
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('Admin seed failed:', error);
    await closePool();
    process.exit(1);
  }
};

if (require.main === module) {
  void run();
}

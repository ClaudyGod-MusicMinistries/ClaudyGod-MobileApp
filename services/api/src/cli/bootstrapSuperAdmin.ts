import { z } from 'zod';
import { pool, closePool } from '../db/pool';
import { hashPassword } from '../utils/password';
import { ensureUserScaffold } from '../lib/userScaffold';

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  displayName: z.string().trim().min(2).max(120),
  password: z.string().min(14).max(200)
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol'),
});

async function bootstrap(): Promise<void> {
  const input = inputSchema.parse({
    email: process.env.CLAUDYGOD_BOOTSTRAP_ADMIN_EMAIL,
    displayName: process.env.CLAUDYGOD_BOOTSTRAP_ADMIN_NAME,
    password: process.env.CLAUDYGOD_BOOTSTRAP_ADMIN_PASSWORD,
  });

  const client = await pool.connect();
  let userId = '';
  try {
    await client.query('BEGIN');
    await client.query(`SELECT pg_advisory_xact_lock(hashtext('claudygod:bootstrap-super-admin'))`);

    const existingSuperAdmin = await client.query<{ id: string; email: string }>(
      `SELECT id, email FROM app_users WHERE role = 'SUPER_ADMIN' AND is_active = TRUE LIMIT 1`,
    );
    if ((existingSuperAdmin.rowCount ?? 0) > 0) {
      throw new Error(`Bootstrap refused: an active Super Admin already exists (${existingSuperAdmin.rows[0]!.email}).`);
    }

    const existingEmail = await client.query<{ id: string }>(
      `SELECT id FROM app_users WHERE email = $1 LIMIT 1`,
      [input.email],
    );
    if ((existingEmail.rowCount ?? 0) > 0) {
      throw new Error('Bootstrap refused: that email already belongs to an account. No account was promoted automatically.');
    }

    const passwordHash = await hashPassword(input.password);
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO app_users
         (email, password_hash, display_name, role, is_active, email_verified_at)
       VALUES ($1, $2, $3, 'SUPER_ADMIN', TRUE, NOW())
       RETURNING id`,
      [input.email, passwordHash, input.displayName],
    );
    userId = inserted.rows[0]!.id;

    await client.query(
      `INSERT INTO security_audit_log (user_id, event, metadata)
       VALUES ($1, 'super_admin_bootstrapped', $2::jsonb)`,
      [userId, JSON.stringify({ email: input.email, method: 'one_time_cli' })],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  await ensureUserScaffold(userId, input.displayName, input.email);
  process.stdout.write(`Super Admin created for ${input.email}. Remove the bootstrap password from your environment and enable MFA after first sign-in.\n`);
}

bootstrap()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown bootstrap failure';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });

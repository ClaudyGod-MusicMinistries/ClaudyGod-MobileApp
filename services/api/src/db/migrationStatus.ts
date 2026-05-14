import { closePool, pool } from './pool';

type MigrationRow = {
  id: string;
  name: string;
  executed_at: string;
};

type TableRow = {
  table_name: string;
};

const run = async (): Promise<void> => {
  try {
    const ledgerExists = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'schema_migrations'
      ) AS exists
    `);

    if (!ledgerExists.rows[0]?.exists) {
      console.log('Migration ledger: missing');
      console.log('Run npm run migrate:prod before starting the production API.');
      return;
    }

    const migrations = await pool.query<MigrationRow>(`
      SELECT id, name, executed_at
      FROM schema_migrations
      ORDER BY id
    `);

    const tables = await pool.query<TableRow>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const latestMigration = migrations.rows.at(-1);
    console.log(`Migration ledger: ${migrations.rowCount} applied`);
    if (latestMigration) {
      console.log(`Latest migration: ${latestMigration.id} ${latestMigration.name} at ${latestMigration.executed_at}`);
    }
    console.log(`Public tables: ${tables.rowCount}`);
    console.log(tables.rows.map((row) => `- ${row.table_name}`).join('\n'));
  } finally {
    await closePool();
  }
};

if (require.main === module) {
  run().catch(async (error) => {
    await closePool();
    console.error('Migration status check failed:', error);
    process.exit(1);
  });
}

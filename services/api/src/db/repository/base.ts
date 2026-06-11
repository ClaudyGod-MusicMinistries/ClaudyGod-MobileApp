import type { Pool, QueryConfig, QueryResultRow } from 'pg';

export abstract class BaseRepository<T extends QueryResultRow> {
  constructor(
    protected readonly pool: Pool,
    protected readonly table: string,
  ) {}

  protected async query<R extends QueryResultRow>(config: QueryConfig): Promise<R[]> {
    const result = await this.pool.query<R>(config);
    return result.rows;
  }

  async findById(id: string): Promise<T | null> {
    const rows = await this.query<T>({
      text: `SELECT * FROM "${this.table}" WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      values: [id],
    });
    return rows[0] ?? null;
  }

  async findOne(where: Partial<T>): Promise<T | null> {
    const { text, values } = this.buildWhereClause(where);
    const rows = await this.query<T>({
      text: `SELECT * FROM "${this.table}" WHERE ${text} AND deleted_at IS NULL LIMIT 1`,
      values,
    });
    return rows[0] ?? null;
  }

  async findMany(
    where?: Partial<T>,
    limit = 50,
    offset = 0,
  ): Promise<T[]> {
    if (!where || Object.keys(where).length === 0) {
      return this.query<T>({
        text: `SELECT * FROM "${this.table}" WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        values: [limit, offset],
      });
    }
    const { text, values } = this.buildWhereClause(where);
    return this.query<T>({
      text: `SELECT * FROM "${this.table}" WHERE ${text} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      values: [...values, limit, offset],
    });
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const keys = Object.keys(data);
    const cols = keys.map((k) => `"${toSnakeCase(k)}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map((k) => (data as Record<string, unknown>)[k]);

    const rows = await this.query<T>({
      text: `INSERT INTO "${this.table}" (${cols}) VALUES (${placeholders}) RETURNING *`,
      values,
    });
    return rows[0]!;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return this.findById(id);

    const sets = keys.map((k, i) => `"${toSnakeCase(k)}" = $${i + 1}`).join(', ');
    const values = keys.map((k) => (data as Record<string, unknown>)[k]);

    const rows = await this.query<T>({
      text: `UPDATE "${this.table}" SET ${sets}, updated_at = NOW() WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING *`,
      values: [...values, id],
    });
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.query<T>({
      text: `UPDATE "${this.table}" SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      values: [id],
    });
    return rows.length > 0;
  }

  async count(where?: Partial<T>): Promise<number> {
    let text: string;
    let values: unknown[];

    if (!where || Object.keys(where).length === 0) {
      text = `SELECT COUNT(*)::int AS count FROM "${this.table}" WHERE deleted_at IS NULL`;
      values = [];
    } else {
      const clause = this.buildWhereClause(where);
      text = `SELECT COUNT(*)::int AS count FROM "${this.table}" WHERE ${clause.text} AND deleted_at IS NULL`;
      values = clause.values;
    }

    const rows = await this.query<{ count: number }>({ text, values });
    return rows[0]?.count ?? 0;
  }

  private buildWhereClause(where: Partial<T>): { text: string; values: unknown[] } {
    const keys = Object.keys(where);
    const values = keys.map((k) => (where as Record<string, unknown>)[k]);
    const text = keys.map((k, i) => `"${toSnakeCase(k)}" = $${i + 1}`).join(' AND ');
    return { text, values };
  }
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

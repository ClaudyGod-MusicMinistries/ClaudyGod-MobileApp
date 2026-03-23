interface PostgresErrorLike {
  code?: string;
}

const MISSING_STRUCTURE_CODES = new Set(['42P01', '42703']);

export function isMissingDatabaseStructureError(error: unknown): error is PostgresErrorLike {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String((error as PostgresErrorLike).code || '') : '';
  return MISSING_STRUCTURE_CODES.has(code);
}

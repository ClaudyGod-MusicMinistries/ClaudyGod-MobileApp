interface PostgresErrorLike {
  code?: string;
  message?: string;
}

const MISSING_STRUCTURE_CODES = new Set(['42P01', '42703']);
const CONNECTIVITY_CODES = new Set([
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ETIMEDOUT',
  '57P01',
  '57P02',
  '57P03',
  '53300',
  '53400',
  '08000',
  '08006',
  '08001',
]);

const CONNECTIVITY_MESSAGE_PATTERNS = [
  /timeout/i,
  /connection\s+terminated/i,
  /connect/i,
  /getaddrinfo/i,
  /eai_again/i,
  /enotfound/i,
];

export function isMissingDatabaseStructureError(error: unknown): error is PostgresErrorLike {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String((error as PostgresErrorLike).code || '') : '';
  return MISSING_STRUCTURE_CODES.has(code);
}

export function isDatabaseConnectivityError(error: unknown): error is PostgresErrorLike {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String((error as PostgresErrorLike).code || '') : '';
  if (CONNECTIVITY_CODES.has(code)) {
    return true;
  }

  const message = 'message' in error ? String((error as PostgresErrorLike).message || '') : '';
  return CONNECTIVITY_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

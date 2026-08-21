export interface SearchCursor {
  rank: number;
  createdAt: string;
  id: string;
}

export const normalizeSearchText = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').slice(0, 200);

export const encodeSearchCursor = (cursor: SearchCursor): string =>
  Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');

export const decodeSearchCursor = (value: string): SearchCursor => {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<SearchCursor>;
    const createdAt = typeof parsed.createdAt === 'string' ? new Date(parsed.createdAt) : null;
    if (
      typeof parsed.rank !== 'number' || !Number.isFinite(parsed.rank) ||
      !createdAt || Number.isNaN(createdAt.getTime()) ||
      typeof parsed.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(parsed.id)
    ) {
      throw new Error('Malformed search cursor');
    }
    return { rank: parsed.rank, createdAt: createdAt.toISOString(), id: parsed.id };
  } catch {
    throw new Error('Invalid search cursor');
  }
};

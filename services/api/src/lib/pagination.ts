export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  total?: number;
}

interface CursorPayload {
  id: string;
  sortValue: string | number | null;
  direction: 'next' | 'prev';
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    return JSON.parse(raw) as CursorPayload;
  } catch {
    throw new Error('Invalid pagination cursor');
  }
}

export function buildNextCursor<T extends { id: string }>(
  items: T[],
  limit: number,
  sortKey: keyof T,
): string | null {
  if (items.length < limit) return null;
  const last = items[items.length - 1];
  if (!last) return null;
  return encodeCursor({
    id: last.id,
    sortValue: (last[sortKey] as unknown as string | number | null) ?? null,
    direction: 'next',
  });
}

export function buildPrevCursor<T extends { id: string }>(
  items: T[],
  sortKey: keyof T,
): string | null {
  const first = items[0];
  if (!first) return null;
  return encodeCursor({
    id: first.id,
    sortValue: (first[sortKey] as unknown as string | number | null) ?? null,
    direction: 'prev',
  });
}

export function buildCursorPage<T extends { id: string }>(
  items: T[],
  limit: number,
  sortKey: keyof T,
  total?: number,
): CursorPage<T> {
  const hasMore = items.length === limit;
  return {
    items: hasMore ? items.slice(0, limit) : items,
    nextCursor: buildNextCursor(hasMore ? items.slice(0, limit) : items, limit, sortKey),
    prevCursor: buildPrevCursor(items, sortKey),
    hasMore,
    total,
  };
}

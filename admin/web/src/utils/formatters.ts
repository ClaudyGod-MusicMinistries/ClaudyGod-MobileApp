import axios from 'axios';

export function toErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const code = String(error.code || '').toUpperCase();
    const msg = String(error.message || '').toLowerCase();
    if (code === 'ECONNABORTED' || msg.includes('timeout')) return 'This action took too long. Please try again.';
    if (error.response?.status === 401) return 'Your session has expired. Please sign in again.';
    if (error.response?.status === 403) return 'You do not have permission for this action.';
    if (!error.response) return 'We could not complete that request right now. Please try again shortly.';
    const data = (error.response.data ?? {}) as Record<string, unknown>;
    return String(data.message ?? data.error ?? error.message ?? fallback);
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  return new Date(value).toLocaleString();
}

export function truncate(value: string, size = 180): string {
  if (!value) return '';
  if (value.length <= size) return value;
  return `${value.slice(0, size - 1)}…`;
}

export function humanizeToken(value: string): string {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function greetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function parseCsvList(value: string): string[] {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function formatBytes(bytes: number): string {
  const v = Number(bytes || 0);
  if (!Number.isFinite(v) || v <= 0) return '0 B';
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 * 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} MB`;
  return `${(v / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function acceptFromPolicy(policy?: { allowedExtensions?: string[] }): string | undefined {
  if (!policy?.allowedExtensions?.length) return undefined;
  return policy.allowedExtensions.join(',');
}

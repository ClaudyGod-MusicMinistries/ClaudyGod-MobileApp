// Dependency-free "3 days ago" formatter — no date library needed for
// something this small. Precision beyond a week deliberately drops to a
// plain date, since "47 days ago" is less scannable than "Jun 3, 2026".
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function relativeTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';

  const diffSeconds = (date.getTime() - Date.now()) / 1000;
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 45) return 'just now';

  for (const [unit, secondsInUnit] of UNITS) {
    if (absSeconds >= secondsInUnit) {
      const value = Math.round(diffSeconds / secondsInUnit);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(Math.round(diffSeconds / 60), 'minute');
}

// Precision is always available on hover via the native `title` attribute —
// relative time is the scannable summary, this is the source of truth.
export function exactDateTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

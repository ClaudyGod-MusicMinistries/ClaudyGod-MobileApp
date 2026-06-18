// Re-exports the shared context so callers don't need to change import paths.
// All data fetching is done once in WordOfDayProvider (mounted in _layout.tsx).
export type { WordOfDayState } from '../context/WordOfDayContext';
export { useWordOfDayContext as useWordOfDay } from '../context/WordOfDayContext';

import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';

// Single shared breakpoint instance for the whole admin app — the sidebar/drawer split
// (Phase 3) and the responsive table/card switch (Phase 6) both key off the same `lg`
// boundary, so this is the one place that decision is made.
const breakpoints = useBreakpoints(breakpointsTailwind);

export function useAdminBreakpoints() {
  const isDesktop = breakpoints.greaterOrEqual('lg');
  return { isDesktop };
}

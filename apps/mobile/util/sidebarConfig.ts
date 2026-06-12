import { Platform, useWindowDimensions } from 'react-native';

export const SIDEBAR_BREAKPOINT = 1024;

export function getSidebarWidth(width: number): number {
  if (Platform.isTV || width >= 1440) return 260;
  if (width >= SIDEBAR_BREAKPOINT) return 220;
  return 0;
}

export function useSidebar(): { isSidebar: boolean; sidebarWidth: number } {
  const { width } = useWindowDimensions();
  const sidebarWidth = getSidebarWidth(width);
  return { isSidebar: sidebarWidth > 0, sidebarWidth };
}
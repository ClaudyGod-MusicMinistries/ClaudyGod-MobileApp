/**
 * Responsive Design Utilities
 * Provides responsive sizing and spacing based on screen width
 */

import { useWindowDimensions } from 'react-native';

export const SCREEN_SIZES = {
  compactPhone: 375,
  mediumPhone: 600,
  tablet: 900,
  desktop: 1200,
};

/**
 * Get responsive font size based on screen width
 */
export function useResponsiveFontSize(
  compactSize: number,
  mediumSize: number,
  largeSize: number,
  tabletSize?: number
): number {
  const { width } = useWindowDimensions();

  if (width < SCREEN_SIZES.compactPhone) return compactSize;
  if (width < SCREEN_SIZES.mediumPhone) return mediumSize;
  if (width < SCREEN_SIZES.tablet) return largeSize;
  return tabletSize || largeSize;
}

/**
 * Get device type
 */
export function useDeviceType() {
  const { width } = useWindowDimensions();

  return {
    isCompactPhone: width < SCREEN_SIZES.compactPhone,
    isMediumPhone: width >= SCREEN_SIZES.compactPhone && width < SCREEN_SIZES.mediumPhone,
    isLargePhone: width >= SCREEN_SIZES.mediumPhone && width < SCREEN_SIZES.tablet,
    isTablet: width >= SCREEN_SIZES.tablet,
    width,
  };
}

/**
 * Get responsive width with padding calculation
 */
export function getResponsiveWidth(screenWidth: number, padding: number = 32): number {
  return screenWidth - padding;
}

/**
 * Get responsive image height
 */
export function getResponsiveImageHeight(
  screenWidth: number,
  compactHeight: number = 240,
  mediumHeight: number = 280,
  largeHeight: number = 320
): number {
  if (screenWidth < SCREEN_SIZES.compactPhone) return compactHeight;
  if (screenWidth < SCREEN_SIZES.mediumPhone) return mediumHeight;
  return largeHeight;
}

/**
 * Calculate responsive column width in grid
 */
export function getGridColumnWidth(screenWidth: number, columnCount: number, gap: number = 12): number {
  const padding = 32; // horizontal padding
  const totalGapWidth = gap * (columnCount - 1);
  return (screenWidth - padding - totalGapWidth) / columnCount;
}

/**
 * Calculate responsive card sizing
 */
export function getResponsiveCardWidth(
  screenWidth: number,
  baseWidth: number = 160
): {
  small: number;
  medium: number;
  large: number;
} {
  const ratio = screenWidth < SCREEN_SIZES.compactPhone ? 0.9 : 
                screenWidth < SCREEN_SIZES.mediumPhone ? 0.95 : 1;

  return {
    small: baseWidth * 0.8 * ratio,
    medium: baseWidth * ratio,
    large: baseWidth * 1.2 * ratio,
  };
}

/**
 * Determine if we should show compact layout
 */
export function useCompactLayout() {
  const { width } = useWindowDimensions();
  return width < SCREEN_SIZES.mediumPhone;
}

/**
 * Get spacing adjustment based on screen
 */
export function getResponsiveSpacing(
  baseSpacing: number,
  screenWidth: number,
  multiplier: number = 1
): number {
  if (screenWidth < SCREEN_SIZES.compactPhone) {
    return baseSpacing * 0.85 * multiplier;
  }
  if (screenWidth < SCREEN_SIZES.mediumPhone) {
    return baseSpacing * 0.9 * multiplier;
  }
  return baseSpacing * multiplier;
}

/**
 * Get text line height based on font size
 */
export function getResponsiveLineHeight(fontSize: number): number {
  if (fontSize <= 12) return fontSize + 4;
  if (fontSize <= 16) return fontSize + 8;
  return fontSize + 12;
}

/**
 * Media query type object for conditional rendering
 */
export function createMediaQueries(width: number) {
  return {
    isXSmall: width < 320,
    isSmall: width < 375,
    isMedium: width < 600,
    isLarge: width >= 600 && width < 900,
    isXLarge: width >= 900,
  };
}

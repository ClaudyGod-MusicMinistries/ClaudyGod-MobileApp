import { Platform, useWindowDimensions } from 'react-native';

export type AppDeviceClass = 'compactPhone' | 'phone' | 'tablet' | 'desktop' | 'largeDesktop' | 'tv';

export type DeviceClassSnapshot = {
  width: number;
  height: number;
  shortestSide: number;
  longestSide: number;
  deviceClass: AppDeviceClass;
  isTV: boolean;
  isWeb: boolean;
  isNative: boolean;
  isCompactPhone: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isWide: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  isShortViewport: boolean;
  prefersTwoPane: boolean;
  contentGutter: number;
  maxContentWidth: number;
  touchTarget: number;
};

export function classifyAppDevice(width: number, height: number, isTV = Platform.isTV): AppDeviceClass {
  if (isTV) return 'tv';
  if (width >= 1440) return 'largeDesktop';
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  if (width < 390) return 'compactPhone';
  return 'phone';
}

export function createDeviceClassSnapshot(width: number, height: number): DeviceClassSnapshot {
  const normalizedWidth = Math.max(0, Math.round(width));
  const normalizedHeight = Math.max(0, Math.round(height));
  const isTV = Boolean(Platform.isTV);
  const isWeb = Platform.OS === 'web';
  const isNative = !isWeb;
  const deviceClass = classifyAppDevice(normalizedWidth, normalizedHeight, isTV);
  const shortestSide = Math.min(normalizedWidth, normalizedHeight);
  const longestSide = Math.max(normalizedWidth, normalizedHeight);
  const isCompactPhone = deviceClass === 'compactPhone';
  const isPhone = deviceClass === 'compactPhone' || deviceClass === 'phone';
  const isTablet = deviceClass === 'tablet';
  const isDesktop = deviceClass === 'desktop' || deviceClass === 'largeDesktop';
  const isLargeDesktop = deviceClass === 'largeDesktop';
  const isWide = normalizedWidth >= 768;
  const isLandscape = normalizedWidth > normalizedHeight;
  const isPortrait = !isLandscape;
  const isShortViewport = normalizedHeight < (isPhone ? 700 : 760);
  const prefersTwoPane = isTV || isDesktop || (isTablet && isLandscape);

  const contentGutter = isTV
    ? 64
    : isLargeDesktop
      ? 56
      : isDesktop
        ? 48
        : isTablet
          ? 32
          : isCompactPhone
            ? 16
            : 20;

  const maxContentWidth = isTV
    ? 1480
    : isLargeDesktop
      ? 1280
      : isDesktop
        ? 1180
        : isTablet
          ? 920
          : 540;

  const touchTarget = isTV ? 64 : isTablet || isDesktop ? 52 : 48;

  return {
    width: normalizedWidth,
    height: normalizedHeight,
    shortestSide,
    longestSide,
    deviceClass,
    isTV,
    isWeb,
    isNative,
    isCompactPhone,
    isPhone,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isWide,
    isLandscape,
    isPortrait,
    isShortViewport,
    prefersTwoPane,
    contentGutter,
    maxContentWidth,
    touchTarget,
  };
}

export function useDeviceClass(): DeviceClassSnapshot {
  const { width, height } = useWindowDimensions();
  return createDeviceClassSnapshot(width, height);
}

export function pickByDevice<T>(
  device: DeviceClassSnapshot,
  values: Partial<Record<AppDeviceClass | 'phoneLike' | 'wide' | 'default', T>>,
): T {
  const exact = values[device.deviceClass];
  if (exact !== undefined) return exact;

  if (device.isPhone && values.phoneLike !== undefined) return values.phoneLike;
  if ((device.isTablet || device.isDesktop || device.isTV) && values.wide !== undefined) return values.wide;

  if (values.default === undefined) {
    throw new Error('pickByDevice requires a default value when no exact device match exists.');
  }

  return values.default;
}

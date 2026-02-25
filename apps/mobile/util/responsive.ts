import { 
  Dimensions, 
  Platform, 
  StatusBar,
  PixelRatio 
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro - 375x812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Screen size classification
const ScreenSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge'
} as const;

type ResponsiveBreakpointMap<T> = {
  small?: T;
  medium?: T;
  large?: T;
  xlarge?: T;
};

class Responsive {
  width: number;
  height: number;
  aspectRatio: number;
  pixelDensity: number;
  isTablet: boolean;
  screenSize: string;
  orientation: string;

  constructor() {
    this.width = width;
    this.height = height;
    this.aspectRatio = height / width;
    this.pixelDensity = PixelRatio.get();
    this.isTablet = this.isTabletDevice();
    this.screenSize = this.getScreenSize();
    this.orientation = this.getOrientation();
    
    // Listen for dimension changes
    Dimensions.addEventListener('change', this.updateDimensions.bind(this));
  }

  updateDimensions = ({ window }: { window: { width: number; height: number } }) => {
    this.width = window.width;
    this.height = window.height;
    this.aspectRatio = this.height / this.width;
    this.orientation = this.getOrientation();
    this.screenSize = this.getScreenSize();
  }

  getOrientation = (): string => {
    return this.height >= this.width ? 'portrait' : 'landscape';
  }

  isTabletDevice = (): boolean => {
    const pixelDensity = PixelRatio.get();
    const adjustedWidth = this.width * pixelDensity;
    const adjustedHeight = this.height * pixelDensity;
    
    if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
      return true;
    } else if (pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920)) {
      return true;
    } else {
      return false;
    }
  }

  getScreenSize = (): string => {
    const shortDimension = Math.min(this.width, this.height);
    
    if (shortDimension >= 400) return ScreenSize.XLARGE;
    if (shortDimension >= 375) return ScreenSize.LARGE;
    if (shortDimension >= 320) return ScreenSize.MEDIUM;
    return ScreenSize.SMALL;
  }

  // Scale based on width
  scaleWidth = (size: number): number => {
    return (this.width / BASE_WIDTH) * size;
  }

  // Scale based on height
  scaleHeight = (size: number): number => {
    return (this.height / BASE_HEIGHT) * size;
  }

  // Moderate scale - balances between width and height scaling
  moderateScale = (size: number, factor: number = 0.5): number => {
    return size + (this.scaleWidth(size) - size) * factor;
  }

  // Font scaling with constraints
  scaleFont = (size: number, minSize: number = 10, maxSize: number = 100): number => {
    const scaledSize = this.scaleWidth(size);
    return Math.max(minSize, Math.min(maxSize, scaledSize));
  }

  // Percentage calculations
  widthPercent = (percent: number): number => {
    return (this.width * percent) / 100;
  }

  heightPercent = (percent: number): number => {
    return (this.height * percent) / 100;
  }

  // Platform specific scaling
  platformScale = (size: number, iosFactor: number = 1, androidFactor: number = 1): number => {
    const baseSize = this.scaleWidth(size);
    return Platform.OS === 'ios' 
      ? baseSize * iosFactor 
      : baseSize * androidFactor;
  }

  // Responsive padding/margin
  responsivePadding = (horizontal: number, vertical: number) => {
    return {
      paddingHorizontal: this.scaleWidth(horizontal),
      paddingVertical: this.scaleHeight(vertical),
    };
  }

  // Safe area handling
  getSafeAreaPadding = () => {
    const isLandscape = this.orientation === 'landscape';
    
    return {
      paddingTop: Platform.OS === 'ios' ? (isLandscape ? 0 : 44) : StatusBar.currentHeight,
      paddingBottom: Platform.OS === 'ios' ? (isLandscape ? 0 : 34) : 0,
    };
  }

  // Grid system
  grid = (columns: number = 12, gutter: number = 16) => {
    const scaledGutter = this.scaleWidth(gutter);
    const columnWidth = (this.width - (scaledGutter * (columns - 1))) / columns;
    
    return {
      columnWidth,
      gutter: scaledGutter,
      containerWidth: this.width,
      calculateWidth: (span: number) => {
        return (columnWidth * span) + (scaledGutter * (span - 1));
      }
    };
  }

  // Breakpoint system
  breakpoint = <T>(sizes: ResponsiveBreakpointMap<T>): T | undefined => {
    const screenSize = this.screenSize;
    
    switch(screenSize) {
      case ScreenSize.SMALL:
        return sizes.small || sizes.medium || sizes.large || sizes.xlarge;
      case ScreenSize.MEDIUM:
        return sizes.medium || sizes.large || sizes.xlarge || sizes.small;
      case ScreenSize.LARGE:
        return sizes.large || sizes.xlarge || sizes.medium || sizes.small;
      case ScreenSize.XLARGE:
        return sizes.xlarge || sizes.large || sizes.medium || sizes.small;
      default:
        return sizes.medium;
    }
  }
}

// Create singleton instance
const responsive = new Responsive();

export default responsive;
export { ScreenSize };

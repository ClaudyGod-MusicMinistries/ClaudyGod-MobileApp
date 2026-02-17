import 'react-native';

declare module 'react-native' {
  interface FlexStyle {
    gap?: number | string;
    rowGap?: number | string;
    columnGap?: number | string;
  }

  interface TouchableOpacityProps {
    focusable?: boolean;
  }
}

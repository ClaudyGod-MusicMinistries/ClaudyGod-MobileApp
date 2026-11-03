// components/CustomText.tsx
import React, { useContext, useMemo } from 'react';
import { Platform, StyleProp, Text, TextProps, TextStyle, useWindowDimensions } from 'react-native';
import { getResponsiveFontStyle, type FontVariantKey } from '../util/fonts';
import { FontContext } from '../context/FontContext';
import { useAppTheme } from '../util/colorScheme';

export interface CustomTextProps extends Partial<TextProps> {
  variant?: FontVariantKey;
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
  [key: string]: any;
}

export function CustomText({
  variant = 'body',
  children,
  style,
  numberOfLines: numberOfLinesProp,
  ellipsizeMode: ellipsizeModeProp,
  ...props
}: CustomTextProps) {
  const { fontsLoaded } = useContext(FontContext);
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const variantStyle = useMemo(
    () => getResponsiveFontStyle(variant, width, Platform.isTV),
    [variant, width],
  );

  const finalStyle = fontsLoaded
    ? variantStyle
    : { ...variantStyle, fontFamily: undefined };

  const webClampStyle = Platform.OS === 'web' && numberOfLinesProp ? ({
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: numberOfLinesProp,
  } as unknown as TextStyle) : undefined;

  return (
    <Text
      style={[
        { color: theme.colors.text },
        finalStyle,
        style,
        webClampStyle,
      ]}
      numberOfLines={numberOfLinesProp}
      ellipsizeMode={ellipsizeModeProp}
      allowFontScaling={props.allowFontScaling ?? true}
      maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? 1.3}
      {...props}
    >
      {children}
    </Text>
  );
}

// components/CustomText.tsx
import React, { useContext, useMemo } from 'react';
import { Platform, Text, TextProps, useWindowDimensions } from 'react-native';
import { getResponsiveFontStyle, type FontVariantKey } from '../util/fonts';
import { FontContext } from '../context/FontContext';
import { useAppTheme } from '../util/colorScheme';

const variantLineDefaults: Partial<Record<FontVariantKey, number>> = {
  hero: 2,
  display: 2,
  heading: 1,
  title: 1,
  subheading: 2,
  subtitle: 2,
  body: 3,
  label: 1,
  meta: 1,
  caption: 1,
};

interface CustomTextProps extends TextProps {
  variant?: FontVariantKey;
}

export const CustomText: React.FC<CustomTextProps> = ({
  variant = 'body',
  children,
  style,
  numberOfLines: numberOfLinesProp,
  ellipsizeMode: ellipsizeModeProp,
  ...props
}) => {
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

  return (
    <Text
      style={[{ color: theme.colors.text }, finalStyle, style]}
      numberOfLines={numberOfLinesProp ?? variantLineDefaults[variant]}
      ellipsizeMode={ellipsizeModeProp ?? 'tail'}
      allowFontScaling={props.allowFontScaling ?? true}
      maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? 1.08}
      {...props}
    >
      {children}
    </Text>
  );
};

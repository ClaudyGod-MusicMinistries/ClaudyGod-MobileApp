// components/CustomText.tsx
import React, { useContext, useMemo } from 'react';
import { Platform, Text, TextProps, useWindowDimensions } from 'react-native';
import { getResponsiveFontStyle, type FontVariantKey } from '../util/fonts';
import { FontContext } from '../context/FontContext';

interface CustomTextProps extends TextProps {
  variant?: FontVariantKey;
  className?: string;
}

export const CustomText: React.FC<CustomTextProps> = ({
  variant = 'body',
  className,
  children,
  style,
  ...props
}) => {
  const { fontsLoaded } = useContext(FontContext);
  const { width } = useWindowDimensions();
  const variantStyle = useMemo(
    () => getResponsiveFontStyle(variant, width, Platform.isTV),
    [variant, width],
  );

  const finalStyle = fontsLoaded
    ? variantStyle
    : { ...variantStyle, fontFamily: undefined }; // system fallback

  return (
    <Text
      className={className}
      style={[finalStyle, style]}
      allowFontScaling={props.allowFontScaling ?? true}
      maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? 1.18}
      {...props}
    >
      {children}
    </Text>
  );
};

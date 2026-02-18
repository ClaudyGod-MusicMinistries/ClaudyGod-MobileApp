// components/CustomText.tsx
import React, { useContext } from 'react';
import { Text, TextProps } from 'react-native';
import { fontConfig } from '../util/fonts';
import { FontContext } from '../context/FontContext';

interface CustomTextProps extends TextProps {
  variant?: keyof typeof fontConfig;
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
  const variantStyle = fontConfig[variant];

  const finalStyle = fontsLoaded
    ? variantStyle
    : { ...variantStyle, fontFamily: undefined }; // system fallback

  return (
    <Text
      className={className}  // ✅ let Tailwind apply only what you set
      style={[finalStyle, style]} // ✅ variant → your override wins
      {...props}
    >
      {children}
    </Text>
  );
};

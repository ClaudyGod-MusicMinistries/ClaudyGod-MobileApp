/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Text, TextProps } from 'react-native';
import { fontConfig } from '../util/fonts';

interface CustomTextProps extends TextProps {
  variant?: 'display' | 'heading' | 'title' | 'body' | 'caption';
  className?: string;
}

export const CustomText: React.FC<CustomTextProps> = ({
  variant = 'body',
  className,
  children,
  ...props
}) => {
  const fontStyle = fontConfig[variant];

  return (
    <Text
      className={`text-text-primary ${className || ''}`}
      style={fontStyle}
      {...props}
    >
      {children}
    </Text>
  );
};

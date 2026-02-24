import React, { ReactNode } from 'react';
import { TouchableOpacity, TouchableOpacityProps, type StyleProp, type TextStyle } from 'react-native';
import { CustomText } from './CustomText';
import { radius, spacing, tv as tvTokens } from '../styles/designTokens';
import { colors } from '../constants/color';
import { useColorScheme } from '../util/colorScheme';

interface CustomButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode; // Changed from string to ReactNode
  className?: string;
  textStyle?: StyleProp<TextStyle>;
  textClassName?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  textStyle,
  textClassName,
  style,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme];

  const baseStyle = `items-center justify-center`;

  const variantStyle =
    variant === 'primary'
      ? {
          backgroundColor: palette.primary,
          borderColor: palette.primary,
          borderWidth: 0,
        }
      : variant === 'secondary'
      ? {
          backgroundColor: palette.secondary,
          borderColor: palette.secondary,
          borderWidth: 0,
        }
      : variant === 'outline'
      ? {
          backgroundColor: 'transparent',
          borderColor: palette.primary,
          borderWidth: 1,
        }
      : {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };

  const sizeStyle =
    size === 'sm'
      ? {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          minHeight: 40,
        }
      : size === 'lg'
      ? {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: 56,
        }
      : {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minHeight: 48,
        };

  // Only wrap with CustomText if children is a string
  const renderContent = () => {
    if (typeof children === 'string') {
      return (
        <CustomText 
          className={`${textClassName || ''}`}
          style={[{ color: textColor }, textStyle]}
          variant={size === 'sm' ? 'caption' : 'body'}
        >
          {children}
        </CustomText>
      );
    }
    return children;
  };

  const textColor =
    variant === 'outline'
      ? palette.primary
      : variant === 'text'
      ? palette.primary
      : '#FFFFFF';

  return (
    <TouchableOpacity
      className={`${baseStyle} ${className || ''}`}
      style={[
        {
          borderRadius: radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          ...variantStyle,
          ...sizeStyle,
        },
        style,
      ]}
      focusable
      hitSlop={tvTokens.hitSlop}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

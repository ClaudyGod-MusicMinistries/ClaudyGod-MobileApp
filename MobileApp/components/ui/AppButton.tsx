// components/ui/AppButton.tsx
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export function AppButton({ title, variant = 'primary', style, ...props }: AppButtonProps) {
  const theme = useAppTheme();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      {...props}
      style={[
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.pill,
          backgroundColor: isPrimary
            ? theme.colors.primary
            : isSecondary
            ? theme.colors.secondary
            : 'transparent',
          borderWidth: isOutline ? 1 : 0,
          borderColor: isOutline ? theme.colors.primary : 'transparent',
        },
        style,
      ]}
    >
      <CustomText
        style={{
          color: isPrimary || isSecondary ? theme.colors.text.inverse : theme.colors.primary,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        {title}
      </CustomText>
    </TouchableOpacity>
  );
}


// components/ui/Chip.tsx
import React from 'react';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function Chip({ label, active, onPress, disabled }: ChipProps) {
  const theme = useAppTheme();
  const background = active ? theme.colors.surfaceAlt : theme.colors.surface;
  const color = active ? theme.colors.text : theme.colors.textSecondary;
  const opacity = disabled ? 0.45 : 1;
  const borderColor = disabled
    ? theme.colors.border
    : active
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <TVTouchable
      onPress={disabled ? undefined : onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: theme.radius.md,
        backgroundColor: background,
        borderWidth: 1,
        borderColor,
        opacity,
      }}
    >
      <CustomText
        variant="label"
        style={{ color, textTransform: 'uppercase', letterSpacing: 0.18 }}
      >
        {label}
      </CustomText>
    </TVTouchable>
  );
}

// components/ui/Chip.tsx
import React from 'react';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { TVTouchable } from './TVTouchable';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  const theme = useAppTheme();
  const background = active ? theme.colors.primary : theme.colors.surface;
  const color = active ? theme.colors.text.inverse : theme.colors.text.secondary;

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: theme.radius.pill,
        backgroundColor: background,
        borderWidth: 1,
        borderColor: active ? theme.colors.primary : theme.colors.border,
      }}
    >
      <CustomText variant="label" style={{ color, letterSpacing: 0.2 }}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

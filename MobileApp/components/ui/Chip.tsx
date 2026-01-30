// components/ui/Chip.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  const theme = useAppTheme();
  const background = active ? theme.colors.primary : theme.colors.surface;
  const color = active ? theme.colors.text.inverse : theme.colors.text.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.pill,
        backgroundColor: background,
        borderWidth: 1,
        borderColor: active ? theme.colors.primary : theme.colors.border,
      }}
    >
      <CustomText style={{ color, fontSize: theme.typography.label }}>{label}</CustomText>
    </TouchableOpacity>
  );
}


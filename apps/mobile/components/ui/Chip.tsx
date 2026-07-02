// components/ui/Chip.tsx
import React from 'react';
import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { TVTouchable } from './TVTouchable';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  chipBase: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: theme.radius.md, borderWidth: 1,
  },
  labelBase: { textTransform: 'uppercase', letterSpacing: 0.18 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function Chip({ label, active, onPress, disabled }: ChipProps) {
  const styles = useStyles();
  const theme  = useAppTheme();

  const background  = active   ? theme.colors.surfaceAlt : theme.colors.surface;
  const color       = active   ? theme.colors.text       : theme.colors.textSecondary;
  const opacity     = disabled ? 0.45 : 1;
  const borderColor = disabled ? theme.colors.border
    : active ? theme.colors.primary : theme.colors.border;

  return (
    <TVTouchable
      onPress={disabled ? undefined : onPress}
      style={[styles.chipBase, { backgroundColor: background, borderColor, opacity }]}
    >
      <CustomText variant="label" style={[styles.labelBase, { color }]}>
        {label}
      </CustomText>
    </TVTouchable>
  );
}

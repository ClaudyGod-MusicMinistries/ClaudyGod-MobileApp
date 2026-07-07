import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { CustomText } from '../CustomText';
import { TVTouchable } from './TVTouchable';
import { SurfaceCard } from './SurfaceCard';

const useStyles = makeStyles((theme) => ({
  card:      { padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.dangerSurface,
  },
  textFill:  { flex: 1, minWidth: 0 },
  title:     { color: theme.colors.text },
  message:   { color: theme.colors.textSecondary, marginTop: 2 },
  retryBtn: {
    borderRadius: theme.radius.pill, borderWidth: 1,
    borderColor: theme.colors.dangerBorder, backgroundColor: theme.colors.dangerSurface,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  retryText: { color: theme.colors.danger, fontWeight: '600' },
}));

// Shown when a screen's data fetch fails — previously this state was silently swallowed
// (an available `error` field that no screen ever rendered), which meant fetch failures
// looked identical to a genuinely empty feed. Give it a real, actionable UI instead.
export function InlineErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();

  return (
    <SurfaceCard tone="subtle" style={styles.card}>
      <View style={styles.iconBox}>
        <MaterialIcons name="error-outline" size={18} color={theme.colors.danger} />
      </View>
      <View style={styles.textFill}>
        <CustomText variant="label" style={styles.title}>Couldn&apos;t load this</CustomText>
        <CustomText variant="caption" style={styles.message} numberOfLines={2}>{message}</CustomText>
      </View>
      <TVTouchable onPress={onRetry} showFocusBorder={false} style={styles.retryBtn}>
        <CustomText variant="caption" style={styles.retryText}>Retry</CustomText>
      </TVTouchable>
    </SurfaceCard>
  );
}

// components/ui/StatCard.tsx
import React from 'react';
import { View, Animated, Platform } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { CustomText } from '../CustomText';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  backgroundColor?: string;
  delay?: number;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  animWrap:   { marginBottom: theme.spacing.md },
  card: {
    borderRadius: theme.radius.lg, overflow: 'hidden',
    padding: theme.spacing.lg, backgroundColor: theme.colors.card,
  },
  headerRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  iconWrap:   { marginRight: theme.spacing.sm },
  labelText: {
    color: theme.colors.textSecondary, fontSize: 10.8, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.2,
  },
  valueRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  valueText:  { color: theme.colors.text, fontSize: 20, fontWeight: '600', letterSpacing: 0 },
  trendPill: {
    paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: theme.radius.sm,
  },
  trendText:  { fontSize: 10.8, fontWeight: '600' },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  backgroundColor,
  delay = 0,
}) => {
  const styles = useStyles();
  const theme = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, delay }).start();
  }, [scaleAnim, delay]);

  const trendColor = trend === 'up' ? theme.colors.success : theme.colors.danger;

  return (
    <Animated.View style={[styles.animWrap, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.card, backgroundColor ? { backgroundColor } : null]}>
        <View style={styles.headerRow}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <CustomText style={styles.labelText}>{label}</CustomText>
        </View>

        <View style={styles.valueRow}>
          <CustomText style={styles.valueText}>{value}</CustomText>

          {trend && trendValue ? (
            <View style={styles.trendPill}>
              <CustomText style={[styles.trendText, { color: trendColor }]}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </CustomText>
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
};

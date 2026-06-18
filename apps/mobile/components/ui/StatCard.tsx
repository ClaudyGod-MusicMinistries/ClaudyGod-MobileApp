// components/ui/StatCard.tsx
/**
 * Statistics Card Component
 * Beautiful card with gradient backgrounds and smooth animations
 */

import React from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';
import { spacing, radius } from '../../styles/designTokens';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  backgroundColor?: string;
  delay?: number;
  gradient?: readonly [string, string, ...string[]];
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  backgroundColor,
  delay = 0,
}) => {
  const theme = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, delay }).start();
  }, [scaleAnim, delay]);

  const trendColor = trend === 'up' ? theme.colors.success : theme.colors.danger;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: spacing.md }}>
      <View style={[styles.cardContainer, { backgroundColor: backgroundColor || theme.colors.card }]}>
        <View style={styles.header}>
          {icon && <View style={{ marginRight: spacing.sm }}>{icon}</View>}
          <CustomText style={[styles.label, { color: theme.colors.textSecondary }]}>
            {label}
          </CustomText>
        </View>

        <View style={styles.content}>
          <CustomText style={[styles.value, { color: theme.colors.text }]}>
            {value}
          </CustomText>

          {trend && trendValue && (
            <View style={styles.trend}>
              <CustomText style={[styles.trendValue, { color: trendColor }]}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </CustomText>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 10.8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
  },
  trend: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.sm,
  },
  trendValue: {
    fontSize: 10.8,
    fontWeight: '600',
  },
});

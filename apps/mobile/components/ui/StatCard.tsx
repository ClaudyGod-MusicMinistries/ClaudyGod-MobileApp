// components/ui/StatCard.tsx
/**
 * Statistics Card Component
 * Beautiful card with gradient backgrounds and smooth animations
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';
import { spacing, radius, shadows } from '../../styles/designTokens';

type GradientColors = readonly [string, string, ...string[]];

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  backgroundColor?: string;
  delay?: number;
  gradient?: GradientColors;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  backgroundColor,
  delay = 0,
  gradient,
}) => {
  const theme = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      delay,
    }).start();
  }, [scaleAnim, delay]);

  const trendColor = trend === 'up' ? theme.colors.success : theme.colors.danger;
  const gradientColors: GradientColors = gradient ?? [theme.colors.primary, theme.colors.accent];

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        marginBottom: spacing.md,
      }}
    >
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              backgroundColor: backgroundColor || theme.colors.surface,
            },
          ]}
        >
          {/* Overlay for opacity */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: backgroundColor ? 'transparent' : 'rgba(255,255,255,0.05)',
              },
            ]}
          >
            <View style={styles.header}>
              {icon && <View style={{ marginRight: spacing.sm }}>{icon}</View>}
              <CustomText
                style={[styles.label, { color: theme.colors.textSecondary }]}
              >
                {label}
              </CustomText>
            </View>

            <View style={styles.content}>
              <CustomText style={[styles.value, { color: theme.colors.text }]}>
                {value}
              </CustomText>

              {trend && trendValue && (
                <View style={styles.trend}>
                  <CustomText
                    style={[
                      styles.trendValue,
                      { color: trendColor },
                    ]}
                  >
                    {trend === 'up' ? '↑' : '↓'} {trendValue}
                  </CustomText>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: shadows.card.shadowOpacity,
    shadowRadius: shadows.card.shadowRadius,
    shadowOffset: shadows.card.shadowOffset,
    elevation: 8,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trend: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.sm,
  },
  trendValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});

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
        marginBottom: 16,
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
              {icon && <View style={{ marginRight: 12 }}>{icon}</View>}
              <CustomText
                style={[styles.label, { color: theme.colors.text.secondary }]}
              >
                {label}
              </CustomText>
            </View>

            <View style={styles.content}>
              <CustomText style={[styles.value, { color: theme.colors.text.primary }]}>
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  trendValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});

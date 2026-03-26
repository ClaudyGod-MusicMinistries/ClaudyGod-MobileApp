// components/ui/StatCard.tsx
/**
 * Statistics Card Component
 * Beautiful card displaying metrics with animations
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  backgroundColor?: string;
  delay?: number;
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
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      delay,
    }).start();
  }, [scaleAnim, delay]);

  const trendColor = trend === 'up' ? theme.colors.success : theme.colors.danger;

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        marginBottom: 16,
      }}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: backgroundColor || theme.colors.card,
            borderColor: theme.colors.border,
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  trend: {
    padding: 8,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});

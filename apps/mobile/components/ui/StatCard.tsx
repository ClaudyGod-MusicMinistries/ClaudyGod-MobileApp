// components/ui/StatCard.tsx
import React from 'react';
import { View, Animated, Platform } from 'react-native';
import { useAppTheme } from '../../util/colorScheme';
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
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: theme.spacing.md }}>
      <View
        style={{
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          padding: theme.spacing.lg,
          backgroundColor: backgroundColor ?? theme.colors.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
          {icon ? <View style={{ marginRight: theme.spacing.sm }}>{icon}</View> : null}
          <CustomText style={{ color: theme.colors.textSecondary, fontSize: 10.8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.2 }}>
            {label}
          </CustomText>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <CustomText style={{ color: theme.colors.text, fontSize: 20, fontWeight: '600', letterSpacing: 0 }}>
            {value}
          </CustomText>

          {trend && trendValue ? (
            <View
              style={{
                paddingVertical: theme.spacing.xs,
                paddingHorizontal: theme.spacing.sm,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: theme.radius.sm,
              }}
            >
              <CustomText style={{ color: trendColor, fontSize: 10.8, fontWeight: '600' }}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </CustomText>
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
};

// components/layout/DashboardFooter.tsx
import React from 'react';
import { View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { SurfaceCard } from '../ui/SurfaceCard';
import { AppButton } from '../ui/AppButton';
import { useAppTheme } from '../../util/colorScheme';

interface DashboardFooterProps {
  onSupportPress?: () => void;
  onLiveAlertsPress?: () => void;
  onFeedbackPress?: () => void;
}

export function DashboardFooter({
  onSupportPress,
  onLiveAlertsPress,
  onFeedbackPress,
}: DashboardFooterProps) {
  const theme = useAppTheme();

  return (
    <View style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.xxl, gap: theme.spacing.lg }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <CustomText variant="label" style={{ color: theme.colors.textSecondary, letterSpacing: 0.9 }}>
          STAY CONNECTED
        </CustomText>
        <CustomText variant="heading" style={{ color: theme.colors.text }}>
          Support and stay in the loop
        </CustomText>
        <CustomText
          variant="caption"
          style={{ color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 280 }}
        >
          Get live updates, share feedback, and keep the ministry moving forward.
        </CustomText>
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(109,40,217,0.14)',
                borderWidth: 1,
                borderColor: 'rgba(109,40,217,0.24)',
              }}
            >
              <MaterialIcons name="favorite" size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
                Support the ministry
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
                Give once or set a daily, weekly, or monthly plan.
              </CustomText>
            </View>
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <AppButton
              title="Support now"
              onPress={onSupportPress}
              leftIcon={<MaterialIcons name="arrow-forward" size={16} color={theme.colors.textInverse} />}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(34,197,94,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(34,197,94,0.2)',
              }}
            >
              <MaterialIcons name="notifications-active" size={22} color={theme.colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
                Live alerts
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
                Be the first to know when we go live.
              </CustomText>
            </View>
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <AppButton
              title="Notify me"
              variant="secondary"
              onPress={onLiveAlertsPress}
              leftIcon={<MaterialIcons name="notifications" size={16} color={theme.colors.text} />}
            />
          </View>
        </SurfaceCard>
      </View>

      <Pressable
        onPress={onFeedbackPress}
        style={{
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceAlt,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialIcons name="forum" size={18} color={theme.colors.primary} />
          <CustomText variant="body" style={{ color: theme.colors.text }}>
            Send feedback or prayer requests
          </CustomText>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </Pressable>

      <CustomText
        variant="caption"
        style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm }}
      >
        © 2026 ClaudyGod. All rights reserved.
      </CustomText>
    </View>
  );
}

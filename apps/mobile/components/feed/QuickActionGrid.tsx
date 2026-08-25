import React from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { CustomText } from '../CustomText';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { TVTouchable } from '../ui/TVTouchable';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { common } from '../../styles/commonStyles';
import { useFeedStyles } from './styles';

export type QuickAction = {
  label: string;
  hint?: string;
  icon: AppIconName;
  onPress: () => void;
};

function getActionAccent(icon: string, theme: ReturnType<typeof useAppTheme>): string {
  const map: Record<string, string> = {
    'graphic-eq': theme.colors.primary, 'smart-display': theme.colors.info,
    'live-tv': theme.colors.danger, search: theme.colors.success,
    headphones: theme.colors.primary, library: theme.colors.warning,
  };
  return map[icon] ?? theme.colors.primary;
}

export function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;

  if (compact) {
    return (
      <FadeIn delay={80}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingHorizontal: 2, paddingVertical: 4 }}>
          {actions.map((action) => {
            const accent = getActionAccent(action.icon, theme);
            return (
              <TVTouchable
                key={action.label}
                onPress={action.onPress}
                showFocusBorder={false}
                accessibilityRole="button"
                accessibilityLabel={action.hint ? `${action.label}. ${action.hint}` : action.label}
              >
                <View style={styles.quickCompactItem}>
                  <View style={styles.quickCompactCircle}>
                    <AppIcon name={action.icon} size={23} color={accent} />
                  </View>
                  <CustomText variant="caption" style={styles.quickCompactLabel} numberOfLines={1}>
                    {action.label}
                  </CustomText>
                </View>
              </TVTouchable>
            );
          })}
        </ScrollView>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={80}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {actions.map((action) => {
          const accent = getActionAccent(action.icon, theme);
          return (
            <TVTouchable
              key={action.label}
              onPress={action.onPress}
              showFocusBorder={false}
              style={{ flex: 1 }}
              accessibilityRole="button"
              accessibilityLabel={action.hint ? `${action.label}. ${action.hint}` : action.label}
            >
              <View style={styles.quickWideCard}>
                <View style={{ width: 38, height: 38, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: `${accent}1A` }}>
                  <AppIcon name={action.icon} size={19} color={accent} />
                </View>
                <View style={common.flex1}>
                  <CustomText variant="label" style={styles.quickWideLabel} numberOfLines={1}>{action.label}</CustomText>
                  {action.hint ? (
                    <CustomText variant="caption" style={styles.quickWideHint} numberOfLines={1}>{action.hint}</CustomText>
                  ) : null}
                </View>
              </View>
            </TVTouchable>
          );
        })}
      </View>
    </FadeIn>
  );
}

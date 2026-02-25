import React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';

type HeaderAction = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  accessibilityLabel?: string;
};

type HeaderChip = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

interface BrandedHeaderCardProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: HeaderAction[];
  leadingAction?: HeaderAction;
  chips?: HeaderChip[];
  showEyebrow?: boolean;
}

export function BrandedHeaderCard({
  title,
  subtitle,
  eyebrow = 'ClaudyGod Ministries',
  actions = [],
  leadingAction,
  chips,
  showEyebrow = false,
}: BrandedHeaderCardProps) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';

  const ui = {
    cardBg: isDark ? 'rgba(10,8,17,0.9)' : theme.colors.surface,
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    logoBg: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceAlt,
    logoBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,16,33,0.08)',
    muted: isDark ? 'rgba(194,185,220,0.9)' : 'rgba(96,87,124,0.92)',
    subtle: isDark ? 'rgba(176,167,202,0.9)' : 'rgba(108,99,134,0.9)',
    iconBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(109,40,217,0.05)',
    iconBorder: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(20,16,33,0.08)',
    iconColor: isDark ? '#EFE7FF' : '#3F2A76',
    chipBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surface,
    chipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,33,0.08)',
    chipActiveBg: isDark ? 'rgba(154,107,255,0.16)' : 'rgba(109,40,217,0.08)',
    chipActiveBorder: isDark ? 'rgba(216,194,255,0.34)' : 'rgba(109,40,217,0.16)',
    chipText: isDark ? '#CEC4E7' : '#5C5478',
    chipActiveText: isDark ? '#EFE3FF' : '#4C1D95',
    cardShadow: isDark ? 'rgba(0,0,0,0.24)' : 'rgba(20,16,33,0.06)',
  } as const;

  const renderAction = (action: HeaderAction) => (
    <TVTouchable
      key={`${action.icon}-${action.accessibilityLabel ?? 'action'}`}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
      onPress={action.onPress}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: ui.iconBorder,
        backgroundColor: ui.iconBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      showFocusBorder={false}
    >
      <MaterialIcons name={action.icon} size={18} color={ui.iconColor} />
    </TVTouchable>
  );

  return (
    <View>
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: ui.cardBorder,
          backgroundColor: ui.cardBg,
          paddingHorizontal: 10,
          paddingVertical: 11,
          shadowColor: ui.cardShadow,
          shadowOpacity: isDark ? 0 : 1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8, minHeight: 38 }}>
            {leadingAction ? <View style={{ marginRight: 6 }}>{renderAction(leadingAction)}</View> : null}

            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                borderWidth: 1,
                borderColor: ui.logoBorder,
                backgroundColor: ui.logoBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <Image source={require('../../assets/images/ClaudyGoLogo.webp')} style={{ width: 20, height: 20, borderRadius: 10 }} />
            </View>

            <View style={{ flex: 1 }}>
              {showEyebrow ? (
                <CustomText variant="caption" style={{ color: ui.muted }}>
                  {eyebrow}
                </CustomText>
              ) : null}
              <CustomText
                variant="display"
                style={{
                  color: theme.colors.text.primary,
                  marginTop: showEyebrow ? 1 : 0,
                  fontSize: 15,
                  lineHeight: 19,
                }}
                numberOfLines={1}
              >
                {title}
              </CustomText>
              {subtitle ? (
                <CustomText variant="caption" style={{ color: ui.subtle, marginTop: 2, fontSize: 11 }} numberOfLines={1}>
                  {subtitle}
                </CustomText>
              ) : null}
            </View>
          </View>

          {actions.length ? <View style={{ flexDirection: 'row', gap: 5, marginLeft: 2 }}>{actions.map(renderAction)}</View> : null}
        </View>
      </View>

      {chips?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 2, paddingRight: 8 }}
        >
          {chips.map((chip) => {
            const active = Boolean(chip.active);
            const chipContent = (
              <CustomText variant="caption" style={{ color: active ? ui.chipActiveText : ui.chipText }}>
                {chip.label}
              </CustomText>
            );

            if (chip.onPress) {
              return (
                <TVTouchable
                  key={chip.label}
                  onPress={chip.onPress}
                  style={{
                    marginRight: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? ui.chipActiveBorder : ui.chipBorder,
                    backgroundColor: active ? ui.chipActiveBg : ui.chipBg,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                  showFocusBorder={false}
                >
                  {chipContent}
                </TVTouchable>
              );
            }

            return (
              <View
                key={chip.label}
                style={{
                  marginRight: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? ui.chipActiveBorder : ui.chipBorder,
                  backgroundColor: active ? ui.chipActiveBg : ui.chipBg,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                {chipContent}
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

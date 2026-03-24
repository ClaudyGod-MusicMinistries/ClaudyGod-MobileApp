import React from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';

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
  autoHideSubtitleOnPhone?: boolean;
}

export function BrandedHeaderCard({
  title,
  subtitle,
  eyebrow = 'ClaudyGod Ministries',
  actions = [],
  leadingAction,
  chips,
  showEyebrow = false,
  autoHideSubtitleOnPhone = true,
}: BrandedHeaderCardProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isDark = theme.scheme === 'dark';
  const isTV = width >= 1200;
  const isTablet = width >= 768 && !isTV;
  const isCompact = width < 390;
  const hideSubtitle = Boolean(subtitle) && autoHideSubtitleOnPhone && isCompact;
  const actionSize = isTV ? 44 : isTablet ? 42 : 40;
  const logoWrapSize = isTV ? 44 : isTablet ? 42 : 38;
  const logoSize = isTV ? 24 : 22;
  const chipPaddingX = isCompact ? 10 : 12;
  const chipPaddingY = isCompact ? 6 : 7;

  const ui = {
    muted: isDark ? 'rgba(214,203,183,0.72)' : 'rgba(97,105,114,0.88)',
    subtle: isDark ? 'rgba(183,191,198,0.72)' : 'rgba(97,105,114,0.88)',
    iconBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    iconBorder: theme.colors.border,
    iconColor: theme.colors.text.primary,
    chipBg: theme.colors.surface,
    chipBorder: theme.colors.border,
    chipActiveBg: theme.colors.surfaceAlt,
    chipActiveBorder: theme.colors.primary,
    chipText: theme.colors.text.secondary,
    chipActiveText: theme.colors.text.primary,
  } as const;

  const renderAction = (action: HeaderAction) => (
    <TVTouchable
      key={`${action.icon}-${action.accessibilityLabel ?? 'action'}`}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
      onPress={action.onPress}
      style={{
        width: actionSize,
        height: actionSize,
        borderRadius: theme.radius.md,
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
    <View
      style={{
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: isTablet ? 18 : 16,
        paddingVertical: isTablet ? 18 : 15,
      }}
    >
      <View
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: theme.radius.xl,
          backgroundColor: isDark ? 'rgba(139,92,246,0.05)' : 'rgba(124,89,230,0.04)',
        }}
      />
      <View
        style={{
          paddingHorizontal: 2,
          paddingVertical: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              marginRight: 12,
              minHeight: logoWrapSize,
            }}
          >
            {leadingAction ? <View style={{ marginRight: 10 }}>{renderAction(leadingAction)}</View> : null}

            <View
              style={{
                width: logoWrapSize,
                height: logoWrapSize,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Image
                source={BRAND_LOGO_ASSET}
                style={{ width: logoSize, height: logoSize, borderRadius: Math.round(logoSize / 2) }}
              />
            </View>

            <View style={{ flex: 1 }}>
              {showEyebrow ? (
                <CustomText variant="caption" style={{ color: ui.muted }}>
                  {eyebrow}
                </CustomText>
              ) : null}
              <CustomText
                variant="heading"
                style={{
                  color: theme.colors.text.primary,
                  marginTop: showEyebrow ? 2 : 0,
                  fontSize: isTV ? 20 : isTablet ? 18 : isCompact ? 15 : 16,
                  lineHeight: isTV ? 25 : isTablet ? 23 : isCompact ? 20 : 21,
                }}
                numberOfLines={2}
              >
                {title}
              </CustomText>
              {subtitle && !hideSubtitle ? (
                <CustomText
                  variant="body"
                  style={{
                    color: ui.subtle,
                    marginTop: 5,
                    fontSize: isCompact ? 11 : 12,
                    lineHeight: isCompact ? 15 : 17,
                  }}
                  numberOfLines={2}
                >
                  {subtitle}
                </CustomText>
              ) : null}
            </View>
          </View>

          {actions.length ? <View style={{ flexDirection: 'row', gap: 8, marginLeft: 10 }}>{actions.map(renderAction)}</View> : null}
        </View>
      </View>

      {chips?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 2, paddingRight: 8 }}
        >
          {chips.map((chip) => {
            const active = Boolean(chip.active);
            const chipContent = (
              <CustomText variant="label" style={{ color: active ? ui.chipActiveText : ui.chipText }}>
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
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: active ? ui.chipActiveBorder : ui.chipBorder,
                    backgroundColor: active ? ui.chipActiveBg : ui.chipBg,
                    paddingHorizontal: chipPaddingX,
                    paddingVertical: chipPaddingY,
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
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: active ? ui.chipActiveBorder : ui.chipBorder,
                  backgroundColor: active ? ui.chipActiveBg : ui.chipBg,
                  paddingHorizontal: chipPaddingX,
                  paddingVertical: chipPaddingY,
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

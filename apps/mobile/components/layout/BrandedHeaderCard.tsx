import React from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';
import { APP_ROUTES } from '../../util/appRoutes';

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
  onLogoPress?: () => void;
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
  onLogoPress,
}: BrandedHeaderCardProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDark = theme.scheme === 'dark';
  const isTV = width >= 1200;
  const isTablet = width >= 768 && !isTV;
  const isCompact = width < 390;
  const hideSubtitle = Boolean(subtitle) && autoHideSubtitleOnPhone && isCompact;
  const actionSize = isTV ? 44 : isTablet ? 42 : 38;
  const logoWrapSize = isTV ? 42 : isTablet ? 40 : 34;
  const logoSize = isTV ? 22 : 20;
  const chipPaddingX = isCompact ? 10 : 12;
  const chipPaddingY = isCompact ? 5 : 6;

  const ui = {
    muted: theme.colors.textSecondary,
    subtle: theme.colors.textSecondary,
    iconBg: isDark ? 'rgba(255,255,255,0.06)' : theme.colors.surfaceAlt,
    iconBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    iconColor: theme.colors.text,
    chipBg: theme.colors.surface,
    chipBorder: theme.colors.border,
    chipActiveBg: theme.colors.surfaceAlt,
    chipActiveBorder: theme.colors.primary,
    chipText: theme.colors.textSecondary,
    chipActiveText: theme.colors.text,
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
      <MaterialIcons name={action.icon} size={17} color={ui.iconColor} />
    </TVTouchable>
  );

  const handleLogoPress = onLogoPress ?? (() => router.push(APP_ROUTES.tabs.home));

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: isTablet ? 16 : 14,
        paddingVertical: isTablet ? 14 : 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.18 : 0.08,
        shadowRadius: 10,
        elevation: 6,
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

          <TVTouchable
            onPress={handleLogoPress}
            showFocusBorder={false}
            style={{
              width: logoWrapSize,
              height: logoWrapSize,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Image
              source={BRAND_LOGO_ASSET}
              style={{ width: logoSize, height: logoSize, borderRadius: Math.round(logoSize / 2) }}
            />
          </TVTouchable>

          <View style={{ flex: 1 }}>
            {showEyebrow ? (
              <CustomText variant="caption" style={{ color: ui.muted }}>
                {eyebrow}
              </CustomText>
            ) : null}
            <CustomText
              variant="heading"
              style={{
                color: theme.colors.text,
                marginTop: showEyebrow ? 2 : 0,
                fontSize: isTV ? 18 : isTablet ? 16 : isCompact ? 13 : 15,
                lineHeight: isTV ? 23 : isTablet ? 21 : isCompact ? 17 : 20,
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
                  marginTop: 3,
                  fontSize: isCompact ? 10 : 11,
                  lineHeight: isCompact ? 14 : 15,
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

import React from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.radius.lg, borderWidth: 1,
    borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  headerRow:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  leadingRow:        { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  leadingActionWrap: { marginRight: 10 },
  actionBtnBase: {
    borderRadius: theme.radius.md, borderWidth: 1,
    borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  logoBtnBase: {
    borderRadius: theme.radius.md, borderWidth: 1,
    borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  textFill:          { flex: 1 },
  eyebrowText:       { color: theme.colors.textSecondary },
  titleBase:         { color: theme.colors.text },
  subtitleBase:      { color: theme.colors.textSecondary, marginTop: 3 },
  actionsRow:        { flexDirection: 'row', gap: 8, marginLeft: 10 },
  chipsContent:      { paddingTop: 14, paddingBottom: 2, paddingRight: 8 },
  chipBase:          { marginRight: 8, borderRadius: theme.radius.md, borderWidth: 1 },
  chipActive:        { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt },
  chipInactive:      { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  chipTextActive:    { color: theme.colors.text },
  chipTextInactive:  { color: theme.colors.textSecondary },
}));

// ─── Component ────────────────────────────────────────────────────────────────

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
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTV = width >= 1200;
  const isTablet = width >= 768 && !isTV;
  const isCompact = width < 390;
  const hideSubtitle = Boolean(subtitle) && autoHideSubtitleOnPhone && isCompact;
  const actionSize = isTV ? 44 : isTablet ? 42 : 38;
  const logoWrapSize = isTV ? 42 : isTablet ? 40 : 34;
  const logoSize = isTV ? 22 : 20;
  const chipPaddingX = isCompact ? 10 : 12;
  const chipPaddingY = isCompact ? 5 : 6;

  const renderAction = (action: HeaderAction) => (
    <TVTouchable
      key={`${action.icon}-${action.accessibilityLabel ?? 'action'}`}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
      onPress={action.onPress}
      style={[styles.actionBtnBase, { width: actionSize, height: actionSize }]}
      showFocusBorder={false}
    >
      <MaterialIcons name={action.icon} size={17} color={theme.colors.text} />
    </TVTouchable>
  );

  const handleLogoPress = onLogoPress ?? (() => router.push(APP_ROUTES.tabs.home));

  return (
    <View style={[styles.card, { paddingHorizontal: isTablet ? 16 : 14, paddingVertical: isTablet ? 14 : 12 }]}>
      <View style={styles.headerRow}>
        <View style={[styles.leadingRow, { minHeight: logoWrapSize }]}>
          {leadingAction ? (
            <View style={styles.leadingActionWrap}>{renderAction(leadingAction)}</View>
          ) : null}

          <TVTouchable
            onPress={handleLogoPress}
            showFocusBorder={false}
            style={[styles.logoBtnBase, { width: logoWrapSize, height: logoWrapSize }]}
          >
            <MaterialIcons name="home" size={logoSize} color={theme.colors.textSecondary} />
          </TVTouchable>

          <View style={styles.textFill}>
            {showEyebrow ? (
              <CustomText variant="caption" style={styles.eyebrowText}>{eyebrow}</CustomText>
            ) : null}
            <CustomText
              variant="heading"
              style={[
                styles.titleBase,
                {
                  marginTop: showEyebrow ? 2 : 0,
                  fontSize: isTV ? 18 : isTablet ? 16 : isCompact ? 13 : 15,
                  lineHeight: isTV ? 23 : isTablet ? 21 : isCompact ? 17 : 20,
                },
              ]}
              numberOfLines={2}
            >
              {title}
            </CustomText>
            {subtitle && !hideSubtitle ? (
              <CustomText
                variant="body"
                style={[
                  styles.subtitleBase,
                  { fontSize: isCompact ? 10 : 11, lineHeight: isCompact ? 14 : 15 },
                ]}
                numberOfLines={2}
              >
                {subtitle}
              </CustomText>
            ) : null}
          </View>
        </View>

        {actions.length ? (
          <View style={styles.actionsRow}>{actions.map(renderAction)}</View>
        ) : null}
      </View>

      {chips?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={styles.chipsContent}
        >
          {chips.map((chip) => {
            const active = Boolean(chip.active);
            const chipStyle = [
              styles.chipBase,
              active ? styles.chipActive : styles.chipInactive,
              { paddingHorizontal: chipPaddingX, paddingVertical: chipPaddingY },
            ];
            const chipContent = (
              <CustomText
                variant="label"
                style={active ? styles.chipTextActive : styles.chipTextInactive}
              >
                {chip.label}
              </CustomText>
            );

            if (chip.onPress) {
              return (
                <TVTouchable
                  key={chip.label}
                  onPress={chip.onPress}
                  style={chipStyle}
                  showFocusBorder={false}
                >
                  {chipContent}
                </TVTouchable>
              );
            }

            return (
              <View key={chip.label} style={chipStyle}>
                {chipContent}
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

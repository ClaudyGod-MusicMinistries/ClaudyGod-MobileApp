import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { CustomText } from '../CustomText';
import { makeStyles } from '../../styles/makeStyles';
import { TVTouchable } from './TVTouchable';
import { AppIcon } from './AppIcon';
import { useAppTheme } from '../../util/colorScheme';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  card: {
    minHeight: 104, borderRadius: 14, padding: 15,
    overflow: 'hidden', justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 42, height: 42, borderRadius: theme.radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.controlSelectedIconSurface,
    borderWidth: 1, borderColor: theme.colors.mediaBorder,
  },
  textFill:    { flex: 1, minWidth: 0 },
  eyebrow:     { color: theme.colors.mediaTextMuted, textTransform: 'uppercase', letterSpacing: 0.72 },
  titleText:   { color: theme.colors.onPrimary, marginTop: 3 },
  bodyText:    { color: theme.colors.mediaTextMuted, marginTop: 5, lineHeight: 17 },
  ctaBtnBase: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    minHeight: 38, borderRadius: 999, borderWidth: 1,
    borderColor: theme.colors.mediaBorder, backgroundColor: theme.colors.controlSelectedIconSurface,
    justifyContent: 'center', flexShrink: 0,
  },
  ctaLabel: { color: theme.colors.onPrimary },
}));

// ─── Component ────────────────────────────────────────────────────────────────

interface SupportCardProps {
  onPress: () => void;
}

export function SupportMinistryCard({ onPress }: SupportCardProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <TVTouchable
      onPress={onPress}
      showFocusBorder={false}
      pressScale={0.98}
      haptics
      accessibilityRole="button"
      accessibilityLabel="Partner with the ministry — give support"
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <AppIcon name="volunteer-activism" size={20} color={theme.colors.onPrimary} />
          </View>

          <View style={styles.textFill}>
            <CustomText variant="caption" style={styles.eyebrow}>Support</CustomText>
            <CustomText variant="title" style={styles.titleText} numberOfLines={1}>
              Partner with the ministry
            </CustomText>
            <CustomText variant="caption" style={styles.bodyText} numberOfLines={2}>
              Help keep worship, messages, and live moments available to more people.
            </CustomText>
          </View>

          <View
            style={[
              styles.ctaBtnBase,
              {
                gap: compact ? 0 : 6,
                width: compact ? 40 : undefined,
                paddingHorizontal: compact ? 0 : 12,
              },
            ]}
          >
            {!compact ? (
              <CustomText variant="label" style={styles.ctaLabel} numberOfLines={1}>
                Give support
              </CustomText>
            ) : null}
            <AppIcon name="arrow-forward" size={16} color={theme.colors.onPrimary} />
          </View>
        </View>
      </View>
    </TVTouchable>
  );
}

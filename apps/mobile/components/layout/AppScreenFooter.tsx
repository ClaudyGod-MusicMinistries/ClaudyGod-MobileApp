import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { APP_ROUTES } from '../../util/appRoutes';

type FooterVariant = 'app' | 'landing' | 'legal';

const footerLinks = [
  { label: 'Support', icon: 'help-outline' as const, route: APP_ROUTES.settingsPages.help },
  { label: 'Privacy', icon: 'security' as const, route: APP_ROUTES.settingsPages.privacy },
  { label: 'Give', icon: 'volunteer-activism' as const, route: APP_ROUTES.settingsPages.donate },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  spacer10:    { height: 10 },
  spacer14:    { height: 14 },
  wrapBase: {
    marginTop: 'auto', borderTopWidth: 1,
    borderTopColor: 'rgba(185,148,255,0.10)',
  },
  innerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
  },
  brandFill:    { flex: 1, minWidth: 210 },
  brandName: {
    color: theme.colors.text_accent, letterSpacing: 0.12, fontSize: 11, lineHeight: 14,
  },
  copyright:    { color: theme.colors.textMuted, marginTop: 3, fontSize: 10, lineHeight: 14 },
  linksRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  linkBtn: {
    minHeight: 30, borderRadius: theme.radius.pill, borderWidth: 1,
    borderColor: 'rgba(185,148,255,0.13)', backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 5,
  },
  linkText:     { color: theme.colors.textMuted, fontSize: 10, lineHeight: 13 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function AppScreenFooter({
  compact = false,
  variant = 'app',
}: {
  compact?: boolean;
  variant?: FooterVariant;
}) {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const year = new Date().getFullYear();
  const isLanding = variant === 'landing';

  if (variant === 'app') {
    return <View style={compact ? styles.spacer10 : styles.spacer14} />;
  }

  return (
    <View
      style={[
        styles.wrapBase,
        {
          paddingTop: isLanding ? theme.spacing.lg : theme.spacing.md,
          paddingBottom: compact ? theme.spacing.sm : theme.spacing.md,
        },
      ]}
    >
      <View style={styles.innerRow}>
        <View style={styles.brandFill}>
          <CustomText variant="label" style={styles.brandName} numberOfLines={1}>
            ClaudyGod Music Ministries
          </CustomText>
          <CustomText variant="caption" style={styles.copyright} numberOfLines={2}>
            © {year} · Worship, messages, live ministry, and support.
          </CustomText>
        </View>

        <View style={styles.linksRow}>
          {footerLinks.map((link) => (
            <TVTouchable
              key={link.label}
              onPress={() => router.push(link.route as never)}
              showFocusBorder={false}
              style={styles.linkBtn}
            >
              <MaterialIcons name={link.icon} size={12} color={theme.colors.primary} />
              <CustomText variant="caption" style={styles.linkText}>{link.label}</CustomText>
            </TVTouchable>
          ))}
        </View>
      </View>
    </View>
  );
}

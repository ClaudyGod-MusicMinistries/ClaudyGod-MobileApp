import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';

type FooterVariant = 'app' | 'landing' | 'legal';

const footerLinks = [
  { label: 'Support', icon: 'help-outline' as const, route: APP_ROUTES.settingsPages.help },
  { label: 'Privacy', icon: 'security' as const, route: APP_ROUTES.settingsPages.privacy },
  { label: 'Give', icon: 'volunteer-activism' as const, route: APP_ROUTES.settingsPages.donate },
];

export function AppScreenFooter({
  compact = false,
  variant = 'app',
}: {
  compact?: boolean;
  variant?: FooterVariant;
}) {
  const theme = useAppTheme();
  const router = useRouter();
  const year = new Date().getFullYear();
  const isLanding = variant === 'landing';

  if (variant === 'app') {
    return <View style={{ height: compact ? 10 : 14 }} />;
  }

  return (
    <View
      style={{
        marginTop: 'auto',
        paddingTop: isLanding ? theme.spacing.lg : theme.spacing.md,
        paddingBottom: compact ? theme.spacing.sm : theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(185,148,255,0.10)',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <View style={{ flex: 1, minWidth: 210 }}>
          <CustomText
            variant="label"
            style={{
              color: theme.colors.text_accent,
              letterSpacing: 0.12,
              fontSize: 11,
              lineHeight: 14,
            }}
            numberOfLines={1}
          >
            ClaudyGod Music Ministries
          </CustomText>
          <CustomText
            variant="caption"
            style={{
              color: theme.colors.textMuted,
              marginTop: 3,
              fontSize: 10,
              lineHeight: 14,
            }}
            numberOfLines={2}
          >
            © {year} · Worship, messages, live ministry, and support.
          </CustomText>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {footerLinks.map((link) => (
            <TVTouchable
              key={link.label}
              onPress={() => router.push(link.route as never)}
              showFocusBorder={false}
              style={{
                minHeight: 30,
                borderRadius: theme.radius.pill,
                borderWidth: 1,
                borderColor: 'rgba(185,148,255,0.13)',
                backgroundColor: 'rgba(255,255,255,0.035)',
                paddingHorizontal: 10,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 5,
              }}
            >
              <MaterialIcons name={link.icon} size={12} color={theme.colors.primary} />
              <CustomText variant="caption" style={{ color: theme.colors.textMuted, fontSize: 10, lineHeight: 13 }}>
                {link.label}
              </CustomText>
            </TVTouchable>
          ))}
        </View>
      </View>
    </View>
  );
}

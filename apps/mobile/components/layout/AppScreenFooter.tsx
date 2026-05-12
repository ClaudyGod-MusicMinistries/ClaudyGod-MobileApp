import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';

type FooterVariant = 'app' | 'landing';

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

  return (
    <View
      style={{
        marginTop: isLanding ? theme.spacing.xl : theme.spacing.md,
        paddingTop: isLanding ? theme.spacing.lg : theme.spacing.md,
        paddingBottom: compact ? theme.spacing.sm : theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(19,12,33,0.08)',
      }}
    >
      <View
        style={{
          flexDirection: isLanding ? 'column' : 'row',
          alignItems: isLanding ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isLanding ? 14 : 10,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText
            variant="label"
            style={{
              color: theme.colors.text,
              letterSpacing: 0.18,
            }}
          >
            ClaudyGod Music Ministries
          </CustomText>
          <CustomText
            variant="caption"
            style={{
              color: theme.colors.textMuted ?? theme.colors.textSecondary,
              marginTop: 3,
              maxWidth: isLanding ? 520 : undefined,
            }}
          >
            © {year} · Worship, messages, live ministry, and support.
          </CustomText>
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            alignSelf: isLanding ? 'stretch' : 'auto',
          }}
        >
          {footerLinks.map((link) => (
            <TVTouchable
              key={link.label}
              onPress={() => router.push(link.route as never)}
              showFocusBorder={false}
              style={{
                minHeight: 32,
                borderRadius: theme.radius.pill,
                borderWidth: 1,
                borderColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(19,12,33,0.10)',
                backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.40)',
                paddingHorizontal: 10,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                flexGrow: isLanding ? 1 : 0,
              }}
            >
              <MaterialIcons name={link.icon} size={13} color={theme.colors.primary} />
              <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
                {link.label}
              </CustomText>
            </TVTouchable>
          ))}
        </View>
      </View>
    </View>
  );
}

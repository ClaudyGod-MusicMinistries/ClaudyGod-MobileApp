import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { CustomText } from '../CustomText';
import { SurfaceCard } from '../ui/SurfaceCard';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';

const footerLinks = [
  { label: 'Support', icon: 'help-outline' as const, route: APP_ROUTES.settingsPages.help },
  { label: 'Privacy', icon: 'privacy-tip' as const, route: APP_ROUTES.settingsPages.privacy },
  { label: 'Give', icon: 'volunteer-activism' as const, route: APP_ROUTES.settingsPages.donate },
];

export function AppScreenFooter({ compact = false }: { compact?: boolean }) {
  const theme = useAppTheme();
  const router = useRouter();
  const year = new Date().getFullYear();

  return (
    <SurfaceCard tone="subtle" style={{ padding: compact ? theme.spacing.md : theme.spacing.lg }}>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)',
            }}
          >
            <MaterialIcons name="auto-awesome" size={15} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText variant="label" style={{ color: theme.colors.text }}>
              ClaudyGod Music Ministries
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
              © {year} · Worship, messages, live ministry, and support.
            </CustomText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {footerLinks.map((link) => (
            <TVTouchable
              key={link.label}
              onPress={() => router.push(link.route as never)}
              showFocusBorder={false}
              style={{
                minHeight: 34,
                borderRadius: theme.radius.pill,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(20,16,33,0.035)',
                paddingHorizontal: 11,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <MaterialIcons name={link.icon} size={14} color={theme.colors.primary} />
              <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
                {link.label}
              </CustomText>
            </TVTouchable>
          ))}
        </View>
      </View>
    </SurfaceCard>
  );
}

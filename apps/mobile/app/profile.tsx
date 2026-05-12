import React, { useEffect, useState } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SettingsScaffold } from '../components/layout/SettingsScaffold';
import { CustomText } from '../components/CustomText';
import { useAppTheme } from '../util/colorScheme';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { FadeIn } from '../components/ui/FadeIn';
import { TVTouchable } from '../components/ui/TVTouchable';
import { AppButton } from '../components/ui/AppButton';
import { ActionSheet } from '../components/ui/ActionSheet';
import { fetchUserProfileMetrics } from '../services/supabaseAnalytics';
import { clearMobileSession } from '../services/authService';
import { useRequireMobileSession } from '../hooks/useRequireMobileSession';
import { APP_ROUTES } from '../util/appRoutes';
import { useToast } from '../context/ToastContext';
import { BRAND_LOGO_ASSET } from '../util/brandAssets';

const GROUPS = [
  {
    title: 'Your space',
    items: [
      { icon: 'library-music' as const, label: 'Library', hint: 'Saved songs, videos, and playlists', href: APP_ROUTES.tabs.library },
      { icon: 'graphic-eq' as const, label: 'Music', hint: 'Open the audio player and worship queue', href: APP_ROUTES.tabs.player },
      { icon: 'smart-display' as const, label: 'Videos', hint: 'Watch sessions and replays', href: APP_ROUTES.tabs.videos },
    ],
  },
  {
    title: 'Account care',
    items: [
      { icon: 'settings' as const, label: 'Settings', hint: 'Playback, appearance, and alerts', href: APP_ROUTES.tabs.settings },
      { icon: 'privacy-tip' as const, label: 'Privacy', hint: 'Review privacy and security controls', href: APP_ROUTES.settingsPages.privacy },
      { icon: 'help-outline' as const, label: 'Help', hint: 'Get support when you need it', href: APP_ROUTES.settingsPages.help },
    ],
  },
];

export default function Profile() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isAuthorized = useRequireMobileSession();
  const isTablet = width >= 768;
  const [metrics, setMetrics] = useState({ email: '', displayName: '', totalPlays: 0, liveSubscriptions: 0 });
  const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);

  useEffect(() => {
    if (!isAuthorized) return;

    let active = true;

    const loadMetrics = async () => {
      try {
        const nextMetrics = await fetchUserProfileMetrics();
        if (active) setMetrics(nextMetrics);
      } catch {
        // Keep the page usable if metrics cannot be loaded.
      }
    };

    void loadMetrics();

    return () => {
      active = false;
    };
  }, [isAuthorized]);

  if (!isAuthorized) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  const displayName = metrics.displayName || metrics.email.split('@')[0] || 'Your profile';

  const signOut = async () => {
    try {
      await clearMobileSession();
    } catch {
      // Continue with local navigation if sign-out cleanup fails.
    }

    showToast({ title: 'Signed out', message: 'Your session has been closed.', tone: 'info' });
    router.replace(APP_ROUTES.auth.signIn);
  };

  return (
    <SettingsScaffold
      title="Profile"
      subtitle="Your account, listening activity, and shortcuts."
      hero={
        <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
          <View style={{ flexDirection: isTablet ? 'row' : 'column', alignItems: isTablet ? 'center' : 'flex-start', gap: theme.spacing.lg }}>
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 34,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(183,148,246,0.34)',
                backgroundColor: 'rgba(183,148,246,0.14)',
              }}
            >
              <Image source={BRAND_LOGO_ASSET} style={{ width: 76, height: 76, borderRadius: 24 }} />
            </View>

            <View style={{ flex: 1, gap: 7 }}>
              <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                Account
              </CustomText>
              <CustomText variant="hero" style={{ color: theme.colors.text }} numberOfLines={2}>
                {displayName}
              </CustomText>
              <CustomText variant="body" style={{ color: theme.colors.textSecondary }} numberOfLines={2}>
                {metrics.email || 'Signed in to ClaudyGod'}
              </CustomText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                <StatBadge icon="play-circle-outline" label={`${metrics.totalPlays} plays`} />
                <StatBadge icon="notifications-active" label={`${metrics.liveSubscriptions} alerts`} />
              </View>
            </View>
          </View>
        </SurfaceCard>
      }
    >
      <FadeIn delay={70}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.lg }}>
          <AppButton
            title="Open library"
            size="md"
            onPress={() => router.push(APP_ROUTES.tabs.library)}
            leftIcon={<MaterialIcons name="library-music" size={17} color={theme.colors.textInverse} />}
            style={{ flexGrow: 1 }}
          />
          <AppButton
            title="Settings"
            variant="secondary"
            size="md"
            onPress={() => router.push(APP_ROUTES.tabs.settings)}
            leftIcon={<MaterialIcons name="settings" size={17} color={theme.colors.text} />}
            style={{ flexGrow: 1 }}
          />
        </View>
      </FadeIn>

      {GROUPS.map((group, groupIndex) => (
        <FadeIn key={group.title} delay={110 + groupIndex * 35}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.85, marginBottom: 6 }}>
              {group.title}
            </CustomText>
            {group.items.map((item, index) => (
              <TVTouchable
                key={item.label}
                onPress={() => router.push(item.href as never)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.colors.border,
                }}
                showFocusBorder={false}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.12)' : 'rgba(124,58,237,0.08)',
                  }}
                >
                  <MaterialIcons name={item.icon} size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomText variant="label" style={{ color: theme.colors.text }}>
                    {item.label}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
                    {item.hint}
                  </CustomText>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </TVTouchable>
            ))}
          </SurfaceCard>
        </FadeIn>
      ))}

      <FadeIn delay={210}>
        <AppButton
          title="Sign out"
          variant="outline"
          fullWidth
          size="lg"
          leftIcon={<MaterialIcons name="logout" size={18} color={theme.colors.danger} />}
          textColor={theme.colors.danger}
          onPress={() => setIsLogoutSheetVisible(true)}
          style={{ marginTop: theme.spacing.sm, borderColor: theme.colors.danger }}
        />
      </FadeIn>

      <ActionSheet
        visible={isLogoutSheetVisible}
        title="Sign out?"
        description="You can sign back in anytime to restore your saved content on this device."
        actions={[
          {
            key: 'sign-out',
            label: 'Sign out',
            detail: 'Close your session on this device.',
            icon: 'logout',
            tone: 'destructive',
            onPress: () => {
              void signOut();
            },
          },
        ]}
        onClose={() => setIsLogoutSheetVisible(false)}
      />
    </SettingsScaffold>
  );
}

function StatBadge({ icon, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(183,148,246,0.32)',
        backgroundColor: 'rgba(183,148,246,0.10)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        paddingVertical: 6,
        gap: 6,
      }}
    >
      <MaterialIcons name={icon} size={14} color={theme.colors.primary} />
      <CustomText variant="caption" style={{ color: theme.colors.primary }}>
        {label}
      </CustomText>
    </View>
  );
}

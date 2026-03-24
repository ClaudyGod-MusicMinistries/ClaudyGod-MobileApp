import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SettingsScaffold } from '../components/layout/SettingsScaffold';
import { CustomText } from '../components/CustomText';
import { useAppTheme } from '../util/colorScheme';
import { spacing } from '../styles/designTokens';
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

const groups = [
  {
    title: 'Account',
    items: [
      { icon: 'library-music', label: 'Your Library', href: APP_ROUTES.tabs.library },
      { icon: 'settings-suggest', label: 'Playback Preferences', href: APP_ROUTES.tabs.settings },
      { icon: 'security', label: 'Privacy & Security', href: APP_ROUTES.settingsPages.privacy },
    ],
  },
  {
    title: 'Discover',
    items: [
      { icon: 'ondemand-video', label: 'Video Hub', href: APP_ROUTES.tabs.videos },
      { icon: 'search', label: 'Search & Discovery', href: APP_ROUTES.tabs.search },
      { icon: 'volunteer-activism', label: 'Support the Ministry', href: APP_ROUTES.settingsPages.donate },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-outline', label: 'Help Center', href: APP_ROUTES.settingsPages.help },
      { icon: 'info-outline', label: 'About ClaudyGod', href: APP_ROUTES.settingsPages.about },
    ],
  },
];

export default function Profile() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const isAuthorized = useRequireMobileSession();
  const [metrics, setMetrics] = useState({
    email: '',
    displayName: 'ClaudyGod User',
    totalPlays: 0,
    liveSubscriptions: 0,
  });
  const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    fetchUserProfileMetrics().then(setMetrics);
  }, [isAuthorized]);

  if (!isAuthorized) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  return (
    <SettingsScaffold
      title="Profile"
      subtitle="Manage account, analytics, and live subscriptions."
      hero={
        <FadeIn>
          <SurfaceCard
            tone="subtle"
            style={{
              padding: spacing.lg,
              marginBottom: spacing.lg,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 114,
                height: 114,
                borderRadius: 57,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(205,182,255,0.44)',
                backgroundColor: 'rgba(154,107,255,0.16)',
              }}
            >
              <Image
                source={require('../assets/images/ClaudyGoLogo.webp')}
                style={{ width: 90, height: 90, borderRadius: 45 }}
              />
            </View>

            <CustomText
              variant="display"
              style={{
                color: theme.colors.text.primary,
                marginTop: 14,
                fontSize: 25,
                lineHeight: 31,
                fontFamily: 'ClashDisplay_700Bold',
              }}
            >
              {metrics.displayName}
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
              {metrics.email || 'Sign in to sync your profile'}
            </CustomText>

            <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
              <StatBadge icon="play-circle-outline" label={`${metrics.totalPlays} Plays`} />
              <StatBadge icon="wifi-tethering" label={`${metrics.liveSubscriptions} Live Alerts`} />
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={90}>
        <AppButton
          title="Open Settings"
          fullWidth
          size="lg"
          onPress={() => router.push(APP_ROUTES.tabs.settings)}
        />
      </FadeIn>

      {groups.map((group, groupIndex) => (
        <FadeIn key={group.title} delay={120 + groupIndex * 35}>
          <SurfaceCard style={{ marginTop: spacing.md, padding: spacing.md }}>
            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: 10 }}>
              {group.title}
            </CustomText>

            <View style={{ gap: 8 }}>
              {group.items.map((item) => (
                <TVTouchable
                  key={item.label}
                  onPress={() => router.push(item.href as never)}
                  style={{
                    minHeight: 54,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(136,120,168,0.22)',
                    backgroundColor: theme.colors.surfaceAlt,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(154,107,255,0.16)',
                      marginRight: 10,
                    }}
                  >
                    <MaterialIcons name={item.icon as any} size={17} color={theme.colors.primary} />
                  </View>

                  <CustomText variant="body" style={{ color: theme.colors.text.primary, flex: 1 }}>
                    {item.label}
                  </CustomText>

                  <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.secondary} />
                </TVTouchable>
              ))}
            </View>
          </SurfaceCard>
        </FadeIn>
      ))}

      <FadeIn delay={240}>
        <AppButton
          title="Log Out"
          variant="ghost"
          fullWidth
          size="lg"
          leftIcon={<MaterialIcons name="logout" size={18} color="#D79CAF" />}
          textColor="#D79CAF"
          onPress={() => setIsLogoutSheetVisible(true)}
          style={{
            marginTop: spacing.lg,
            borderWidth: 1,
            borderColor: 'rgba(215,156,175,0.34)',
            borderRadius: 16,
            backgroundColor: 'rgba(115,42,72,0.18)',
          }}
        />
      </FadeIn>
      <ActionSheet
        visible={isLogoutSheetVisible}
        title="Sign out of ClaudyGod?"
        description="You can sign back in any time to restore your account and saved content."
        actions={[
          {
            key: 'sign-out',
            label: 'Sign Out',
            detail: 'Close your session on this device.',
            icon: 'logout',
            tone: 'destructive',
            onPress: () => {
              void clearMobileSession().finally(() => {
                showToast({
                  title: 'Signed out',
                  message: 'Your session has been closed on this device.',
                  tone: 'info',
                });
                router.replace(APP_ROUTES.auth.signIn);
              });
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
        borderColor: 'rgba(205,182,255,0.48)',
        backgroundColor: 'rgba(154,107,255,0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        paddingVertical: 6,
        gap: 6,
      }}
    >
      <MaterialIcons name={icon} size={14} color={theme.colors.primary} />
      <CustomText variant="label" style={{ color: theme.colors.primary }}>
        {label}
      </CustomText>
    </View>
  );
}

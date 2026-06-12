import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { SettingsScaffold } from '../components/layout/SettingsScaffold';
import { CustomText } from '../components/CustomText';
import { useAppTheme } from '../util/colorScheme';
import { useDeviceClass } from '../util/deviceClassConfig';
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

const NAV_GROUPS = [
  {
    title: 'Your space',
    items: [
      { icon: 'library-music' as const, label: 'Library', hint: 'Saved songs, videos, and playlists',      href: APP_ROUTES.tabs.library, color: '#B794F6' },
      { icon: 'graphic-eq'    as const, label: 'Music',   hint: 'Open the audio player and worship queue', href: APP_ROUTES.tabs.player,  color: '#A78BFA' },
      { icon: 'smart-display' as const, label: 'Videos',  hint: 'Watch sessions and ministry replays',     href: APP_ROUTES.tabs.videos,  color: '#60A5FA' },
      { icon: 'live-tv'       as const, label: 'Live',    hint: 'Tune in to live ministry sessions',       href: APP_ROUTES.tabs.live,    color: '#EF4444' },
    ],
  },
  {
    title: 'Account care',
    items: [
      { icon: 'settings'      as const, label: 'Settings',         hint: 'Playback, appearance, and alerts',     href: APP_ROUTES.tabs.settings,            color: '#B794F6' },
      { icon: 'privacy-tip'   as const, label: 'Privacy',          hint: 'Review privacy and security controls', href: APP_ROUTES.settingsPages.privacy,     color: '#34D399' },
      { icon: 'verified-user' as const, label: 'Account security', hint: 'Email, password, and secure access',   href: APP_ROUTES.accountSecurity,           color: '#FBBF24' },
      { icon: 'help-outline'  as const, label: 'Help',             hint: 'Get support when you need it',         href: APP_ROUTES.settingsPages.help,        color: '#60A5FA' },
    ],
  },
];

function NavRow({
  item,
  isFirst,
}: {
  item: (typeof NAV_GROUPS)[0]['items'][0];
  isFirst: boolean;
}) {
  const theme = useAppTheme();
  const router = useRouter();
  return (
    <TVTouchable
      onPress={() => router.push(item.href as never)}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 13,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: theme.colors.border,
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
          backgroundColor: `${item.color}18`,
        }}
      >
        <MaterialIcons name={item.icon} size={19} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: theme.colors.text }}>
          {item.label}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
          {item.hint}
        </CustomText>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
    </TVTouchable>
  );
}

function StatPill({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; value: string | number }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border,
        backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(17,10,31,0.03)',
        padding: theme.spacing.md, flex: 1, gap: 6,
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}18` }}>
        <MaterialIcons name={icon} size={16} color={theme.colors.primary} />
      </View>
      <CustomText variant="heading" style={{ color: theme.colors.text }}>{value}</CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>{label}</CustomText>
    </View>
  );
}

export default function Profile() {
  const theme = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const isAuthorized = useRequireMobileSession();
  const [metrics, setMetrics] = useState({ email: '', displayName: '', totalPlays: 0, liveSubscriptions: 0 });
  const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);

  const isTwoPane = device.isDesktop || device.isTV;

  useEffect(() => {
    if (!isAuthorized) return;
    let active = true;
    const loadMetrics = async () => {
      try {
        const nextMetrics = await fetchUserProfileMetrics();
        if (active) setMetrics(nextMetrics);
      } catch {
        // Keep the page usable if metrics cannot load.
      }
    };
    void loadMetrics();
    return () => { active = false; };
  }, [isAuthorized]);

  if (!isAuthorized) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  const displayName = metrics.displayName || metrics.email.split('@')[0] || 'Your profile';
  const initial = displayName.charAt(0).toUpperCase();

  const signOut = async () => {
    try { await clearMobileSession(); } catch { /* continue */ }
    showToast({ title: 'Signed out', message: 'Your session has been closed.', tone: 'info' });
    router.replace(APP_ROUTES.auth.signIn);
  };

  return (
    <SettingsScaffold
      title="Profile"
      subtitle="Your account, listening activity, and shortcuts."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg, overflow: 'hidden' }}>
            {/* Subtle gradient accent */}
            <LinearGradient
              colors={['rgba(183,148,246,0.12)', 'rgba(183,148,246,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140, pointerEvents: 'none' }}
            />

            <View style={{ flexDirection: isTwoPane ? 'row' : 'column', alignItems: isTwoPane ? 'center' : 'flex-start', gap: theme.spacing.xl }}>
              {/* Avatar */}
              <View>
                <View
                  style={{
                    width: isTwoPane ? 110 : 96, height: isTwoPane ? 110 : 96,
                    borderRadius: isTwoPane ? 34 : 28,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 2, borderColor: 'rgba(183,148,246,0.34)',
                    backgroundColor: 'rgba(183,148,246,0.14)',
                    overflow: 'hidden',
                  }}
                >
                  <Image source={BRAND_LOGO_ASSET} style={{ width: '80%', height: '80%' }} resizeMode="contain" />
                </View>
                <View
                  style={{
                    position: 'absolute', bottom: -4, right: -4,
                    width: 26, height: 26, borderRadius: 13,
                    backgroundColor: theme.colors.primary,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 2, borderColor: theme.colors.surface,
                  }}
                >
                  <CustomText variant="caption" style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                    {initial}
                  </CustomText>
                </View>
              </View>

              {/* Details */}
              <View style={{ flex: 1, gap: 6 }}>
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  Account
                </CustomText>
                <CustomText variant="hero" style={{ color: theme.colors.text }} numberOfLines={2}>
                  {displayName}
                </CustomText>
                <CustomText variant="body" style={{ color: theme.colors.textSecondary }} numberOfLines={1}>
                  {metrics.email || 'Signed in to ClaudyGod'}
                </CustomText>

                {/* Quick actions */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  <AppButton
                    title="Library"
                    size="sm"
                    onPress={() => router.push(APP_ROUTES.tabs.library)}
                    leftIcon={<MaterialIcons name="library-music" size={15} color={theme.colors.textInverse} />}
                  />
                  <AppButton
                    title="Settings"
                    variant="secondary"
                    size="sm"
                    onPress={() => router.push(APP_ROUTES.tabs.settings)}
                    leftIcon={<MaterialIcons name="settings" size={15} color={theme.colors.text} />}
                  />
                  <AppButton
                    title="Security"
                    variant="secondary"
                    size="sm"
                    onPress={() => router.push(APP_ROUTES.accountSecurity)}
                    leftIcon={<MaterialIcons name="verified-user" size={15} color={theme.colors.text} />}
                  />
                </View>
              </View>
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: theme.spacing.lg }}>
              <StatPill icon="play-circle-outline" label="Plays" value={metrics.totalPlays} />
              <StatPill icon="notifications-active" label="Live alerts" value={metrics.liveSubscriptions} />
              <StatPill icon="star-rate" label="Engagement" value="Active" />
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      {/* Navigation groups — 2-column on desktop/TV */}
      <FadeIn delay={80}>
        <View style={{ flexDirection: isTwoPane ? 'row' : 'column', gap: 14, alignItems: 'flex-start' }}>
          {NAV_GROUPS.map((group, groupIndex) => (
            <View key={group.title} style={{ flex: isTwoPane ? 1 : undefined, width: isTwoPane ? undefined : '100%', marginBottom: isTwoPane ? 0 : 0 }}>
              <FadeIn delay={110 + groupIndex * 35}>
                <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
                  <CustomText
                    variant="caption"
                    style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.85, marginBottom: 4 }}
                  >
                    {group.title}
                  </CustomText>
                  {group.items.map((navItem, index) => (
                    <NavRow key={navItem.label} item={navItem} isFirst={index === 0} />
                  ))}
                </SurfaceCard>
              </FadeIn>
            </View>
          ))}
        </View>
      </FadeIn>

      {/* Sign out */}
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
            onPress: () => { void signOut(); },
          },
        ]}
        onClose={() => setIsLogoutSheetVisible(false)}
      />
    </SettingsScaffold>
  );
}
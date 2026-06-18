import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  View,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { CustomText } from '../components/CustomText';
import { useDeviceClass } from '../util/deviceClassConfig';
import { FadeIn } from '../components/ui/FadeIn';
import { TVTouchable } from '../components/ui/TVTouchable';
import { ActionSheet } from '../components/ui/ActionSheet';
import { fetchUserProfileMetrics } from '../services/supabaseAnalytics';
import { clearMobileSession } from '../services/authService';
import { useRequireMobileSession } from '../hooks/useRequireMobileSession';
import { APP_ROUTES } from '../util/appRoutes';
import { useToast } from '../context/ToastContext';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const NAV_GROUPS = [
  {
    title: 'Your space',
    items: [
      { icon: 'library-music' as const, label: 'Library',          hint: 'Saved songs, videos, and playlists',      href: APP_ROUTES.tabs.library,         color: '#8B5CF6' },
      { icon: 'graphic-eq'    as const, label: 'Music',            hint: 'Open the audio player and worship queue', href: APP_ROUTES.tabs.player,           color: '#A78BFA' },
      { icon: 'smart-display' as const, label: 'Videos',           hint: 'Watch sessions and ministry replays',     href: APP_ROUTES.tabs.videos,           color: '#60A5FA' },
      { icon: 'live-tv'       as const, label: 'Live',             hint: 'Tune in to live ministry sessions',       href: APP_ROUTES.tabs.live,             color: '#EF4444' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'settings'      as const, label: 'Settings',         hint: 'Playback, appearance, and alerts',        href: APP_ROUTES.tabs.settings,        color: '#8B5CF6' },
      { icon: 'privacy-tip'   as const, label: 'Privacy',          hint: 'Privacy and security controls',           href: APP_ROUTES.settingsPages.privacy, color: '#34D399' },
      { icon: 'verified-user' as const, label: 'Account security', hint: 'Email, password, and secure access',      href: APP_ROUTES.accountSecurity,       color: '#FBBF24' },
      { icon: 'help-outline'  as const, label: 'Help',             hint: 'Get support when you need it',            href: APP_ROUTES.settingsPages.help,    color: '#60A5FA' },
    ],
  },
];

function NavSection({ group }: { group: (typeof NAV_GROUPS)[0] }) {
  const router = useRouter();
  return (
    <View>
      <CustomText
        style={{
          color: 'rgba(247,242,255,0.35)',
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 8,
          paddingHorizontal: 4,
        }}
      >
        {group.title}
      </CustomText>
      <View style={{ borderRadius: 16, backgroundColor: '#110E1A', overflow: 'hidden' }}>
        {group.items.map((item, index) => (
          <TVTouchable
            key={item.label}
            onPress={() => router.push(item.href as never)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 13,
              paddingHorizontal: 16,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: 'rgba(255,255,255,0.07)',
            }}
            showFocusBorder={false}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${item.color}18`,
              }}
            >
              <MaterialIcons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText style={{ color: '#F7F2FF', fontSize: 14, fontWeight: '600' }}>
                {item.label}
              </CustomText>
              <CustomText
                style={{ color: 'rgba(247,242,255,0.40)', fontSize: 12, marginTop: 2 }}
                numberOfLines={1}
              >
                {item.hint}
              </CustomText>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="rgba(247,242,255,0.25)" />
          </TVTouchable>
        ))}
      </View>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const isAuthorized = useRequireMobileSession();
  const [metrics, setMetrics] = useState({
    email: '',
    displayName: '',
    totalPlays: 0,
    liveSubscriptions: 0,
  });
  const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [80, 140],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const gutter = device.isTV || device.isDesktop ? 40 : 20;

  useEffect(() => {
    if (!isAuthorized) return;
    let active = true;
    void (async () => {
      try {
        const m = await fetchUserProfileMetrics();
        if (active) setMetrics(m);
      } catch { /* keep page usable */ }
    })();
    return () => { active = false; };
  }, [isAuthorized]);

  if (!isAuthorized) {
    return <View style={{ flex: 1, backgroundColor: '#07050C' }} />;
  }

  const displayName = metrics.displayName || metrics.email.split('@')[0] || 'Your profile';
  const initial = displayName.charAt(0).toUpperCase();

  const signOut = async () => {
    try { await clearMobileSession(); } catch { /* continue */ }
    showToast({ title: 'Signed out', message: 'Your session has been closed.', tone: 'info' });
    router.replace(APP_ROUTES.auth.signIn);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#07050C' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#07050C" />

      {/* Floating title that fades in on scroll */}
      <SafeAreaView
        edges={['top']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
        pointerEvents="none"
      >
        <Animated.View
          style={{
            opacity: headerOpacity,
            backgroundColor: '#07050C',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
          }}
        >
          <CustomText style={{ color: '#F7F2FF', fontSize: 15, fontWeight: '700' }}>
            Profile
          </CustomText>
        </Animated.View>
      </SafeAreaView>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: USE_NATIVE_DRIVER },
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Top action row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: gutter,
              paddingTop: 12,
              paddingBottom: 4,
            }}
          >
            <TVTouchable
              onPress={() => router.back()}
              showFocusBorder={false}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <MaterialIcons name="chevron-left" size={24} color="#F7F2FF" />
            </TVTouchable>

            <TVTouchable
              onPress={() => router.push(APP_ROUTES.tabs.settings)}
              showFocusBorder={false}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <MaterialIcons name="settings" size={20} color="#F7F2FF" />
            </TVTouchable>
          </View>

          {/* Hero */}
          <FadeIn>
            <View
              style={{
                alignItems: 'center',
                paddingHorizontal: gutter,
                paddingTop: 28,
                paddingBottom: 36,
              }}
            >
              {/* Avatar circle */}
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: '#2D1B69',
                  borderWidth: 2.5,
                  borderColor: '#8B5CF6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <CustomText
                  style={{ color: '#F7F2FF', fontSize: 38, fontWeight: '700', lineHeight: 46 }}
                >
                  {initial}
                </CustomText>
              </View>

              <CustomText
                style={{
                  color: '#F7F2FF',
                  fontSize: 22,
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: -0.3,
                }}
                numberOfLines={2}
              >
                {displayName}
              </CustomText>

              {metrics.email ? (
                <CustomText
                  style={{ color: 'rgba(247,242,255,0.40)', fontSize: 13, marginTop: 4, textAlign: 'center' }}
                  numberOfLines={1}
                >
                  {metrics.email}
                </CustomText>
              ) : null}

              {/* Stats */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 24,
                  width: '100%',
                  maxWidth: 280,
                }}
              >
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <CustomText style={{ color: '#F7F2FF', fontSize: 20, fontWeight: '700' }}>
                    {metrics.totalPlays}
                  </CustomText>
                  <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 11, marginTop: 3 }}>
                    Plays
                  </CustomText>
                </View>

                <View style={{ width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.10)' }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <CustomText style={{ color: '#F7F2FF', fontSize: 20, fontWeight: '700' }}>
                    {metrics.liveSubscriptions}
                  </CustomText>
                  <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 11, marginTop: 3 }}>
                    Live alerts
                  </CustomText>
                </View>

                <View style={{ width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.10)' }} />

                <View style={{ alignItems: 'center', flex: 1 }}>
                  <CustomText style={{ color: '#8B5CF6', fontSize: 20, fontWeight: '700' }}>
                    ✓
                  </CustomText>
                  <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 11, marginTop: 3 }}>
                    Active
                  </CustomText>
                </View>
              </View>
            </View>
          </FadeIn>

          {/* Navigation groups */}
          <View style={{ paddingHorizontal: gutter, gap: 24 }}>
            <FadeIn delay={60}>
              {NAV_GROUPS.map((group) => (
                <View key={group.title} style={{ marginBottom: 24 }}>
                  <NavSection group={group} />
                </View>
              ))}
            </FadeIn>

            {/* Sign out */}
            <FadeIn delay={120}>
              <TVTouchable
                onPress={() => setIsLogoutSheetVisible(true)}
                showFocusBorder={false}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  backgroundColor: '#110E1A',
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(239,68,68,0.12)',
                  }}
                >
                  <MaterialIcons name="logout" size={18} color="#EF4444" />
                </View>
                <CustomText style={{ color: '#EF4444', fontSize: 14, fontWeight: '600', flex: 1 }}>
                  Sign out
                </CustomText>
                <MaterialIcons name="chevron-right" size={20} color="rgba(239,68,68,0.35)" />
              </TVTouchable>
            </FadeIn>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

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
    </View>
  );
}

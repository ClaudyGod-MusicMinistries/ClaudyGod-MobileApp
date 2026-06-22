import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
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
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ActionSheet } from '../components/ui/ActionSheet';
import { fetchUserProfileMetrics } from '../services/supabaseAnalytics';
import { clearMobileSession } from '../services/authService';
import { useRequireMobileSession } from '../hooks/useRequireMobileSession';
import { useMediaPicker } from '../hooks/useMediaPicker';
import { useContentUpload } from '../hooks/useContentUpload';
import { APP_ROUTES } from '../util/appRoutes';
import { useToast } from '../context/ToastContext';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const PRIMARY = '#8B5CF6';
const BG = '#07050C';
const SURFACE = '#0F0C18';
const SURFACE_ELEVATED = '#141020';
const BORDER = 'rgba(139,92,246,0.14)';
const TEXT = '#F7F2FF';
const TEXT_MUTED = 'rgba(247,242,255,0.42)';
const TEXT_DIM = 'rgba(247,242,255,0.22)';

const NAV_GROUPS = [
  {
    title: 'Your Space',
    items: [
      { icon: 'library-music' as const, label: 'Library',          hint: 'Saved songs, videos, and playlists',      href: APP_ROUTES.tabs.library,          color: '#8B5CF6' },
      { icon: 'graphic-eq'    as const, label: 'Music Player',     hint: 'Open the audio player and worship queue', href: APP_ROUTES.tabs.player,            color: '#A78BFA' },
      { icon: 'smart-display' as const, label: 'Videos',           hint: 'Watch sessions and ministry replays',     href: APP_ROUTES.tabs.videos,            color: '#60A5FA' },
      { icon: 'live-tv'       as const, label: 'Live',             hint: 'Tune in to live ministry sessions',       href: APP_ROUTES.tabs.live,              color: '#EF4444' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'tune'          as const, label: 'Settings',         hint: 'Playback, appearance, and alerts',        href: APP_ROUTES.tabs.settings,          color: '#8B5CF6' },
      { icon: 'privacy-tip'   as const, label: 'Privacy',          hint: 'Privacy and security controls',           href: APP_ROUTES.settingsPages.privacy,  color: '#34D399' },
      { icon: 'verified-user' as const, label: 'Account Security', hint: 'Email, password, and secure access',      href: APP_ROUTES.accountSecurity,        color: '#FBBF24' },
      { icon: 'help-outline'  as const, label: 'Help & Support',   hint: 'Get support when you need it',            href: APP_ROUTES.settingsPages.help,     color: '#60A5FA' },
    ],
  },
];

function NavRow({ item, isFirst }: { item: (typeof NAV_GROUPS)[0]['items'][0]; isFirst: boolean }) {
  const router = useRouter();
  return (
    <TVTouchable
      onPress={() => router.push(item.href as never)}
      style={[styles.navRow, !isFirst && styles.navRowDivider]}
      showFocusBorder={false}
    >
      <View style={[styles.iconBubble, { backgroundColor: `${item.color}18` }]}>
        <MaterialIcons name={item.icon} size={19} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <CustomText style={styles.navLabel}>{item.label}</CustomText>
        <CustomText style={styles.navHint} numberOfLines={1}>{item.hint}</CustomText>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={TEXT_DIM} />
    </TVTouchable>
  );
}

function NavSection({ group }: { group: (typeof NAV_GROUPS)[0] }) {
  return (
    <View>
      <CustomText style={styles.sectionLabel}>{group.title}</CustomText>
      <View style={styles.navCard}>
        {group.items.map((item, i) => (
          <NavRow key={item.label} item={item} isFirst={i === 0} />
        ))}
      </View>
    </View>
  );
}

function StatPill({ value, label, icon, iconColor }: { value: string | number; label: string; icon?: React.ComponentProps<typeof MaterialIcons>['name']; iconColor?: string }) {
  return (
    <View style={styles.statPill}>
      {icon ? (
        <MaterialIcons name={icon} size={18} color={iconColor ?? PRIMARY} style={{ marginBottom: 4 }} />
      ) : (
        <CustomText style={[styles.statValue, iconColor ? { color: iconColor } : null]}>
          {value}
        </CustomText>
      )}
      <CustomText style={styles.statLabel}>{label}</CustomText>
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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAvatarSheetVisible, setIsAvatarSheetVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { pickFromGallery, captureFromCamera } = useMediaPicker();
  const { upload: uploadAvatar, status: avatarUploadStatus } = useContentUpload();

  const scrollY = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [60, 110],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const gutter = device.isTV || device.isDesktop ? 40 : 24;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2200, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(glowPulse, { toValue: 0.5, duration: 2200, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glowPulse]);

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
    return <View style={{ flex: 1, backgroundColor: BG }} />;
  }

  const displayName = metrics.displayName || metrics.email.split('@')[0] || 'Your Profile';
  const initial = displayName.charAt(0).toUpperCase();

  const signOut = async () => {
    setIsSigningOut(true);
    try { await clearMobileSession(); } catch { /* continue */ }
    setIsSigningOut(false);
    setIsLogoutSheetVisible(false);
    showToast({ title: 'Signed out', message: 'Your session has been closed.', tone: 'info' });
    router.replace(APP_ROUTES.auth.signIn);
  };

  const pickAvatar = async (source: 'gallery' | 'camera') => {
    setIsAvatarSheetVisible(false);
    const picked = source === 'gallery'
      ? await pickFromGallery('image')
      : await captureFromCamera('image');
    if (!picked) return;
    setAvatarUri(picked.uri);
    const result = await uploadAvatar(picked);
    if (result) {
      showToast({ title: 'Photo updated', tone: 'info' });
    } else {
      setAvatarUri(null);
      showToast({ title: 'Upload failed', message: 'Could not update your photo.', tone: 'warning' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={BG} />

      {/* Sticky title — fades in as user scrolls */}
      <SafeAreaView
        edges={['top']}
        style={styles.stickyHeader}
        pointerEvents="none"
      >
        <Animated.View style={[styles.stickyHeaderInner, { opacity: headerOpacity }]}>
          <CustomText style={styles.stickyTitle}>Profile</CustomText>
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
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {/* Top toolbar */}
          <View style={[styles.toolbar, { paddingHorizontal: gutter }]}>
            <TVTouchable
              onPress={() => router.back()}
              showFocusBorder={false}
              style={styles.toolbarBtn}
            >
              <MaterialIcons name="chevron-left" size={26} color={TEXT} />
            </TVTouchable>

            <TVTouchable
              onPress={() => router.push(APP_ROUTES.tabs.settings)}
              showFocusBorder={false}
              style={styles.toolbarBtn}
            >
              <MaterialIcons name="tune" size={20} color={TEXT} />
            </TVTouchable>
          </View>

          {/* ── HERO ── */}
          <FadeIn>
            <View style={[styles.hero, { paddingHorizontal: gutter }]}>
              {/* Avatar with pulsing glow ring */}
              <TVTouchable
                onPress={() => setIsAvatarSheetVisible(true)}
                showFocusBorder={false}
                style={styles.avatarWrapper}
              >
                <Animated.View
                  style={[
                    styles.avatarGlow,
                    { opacity: glowPulse },
                  ]}
                />
                <View style={styles.avatar}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <CustomText style={styles.avatarInitial}>{initial}</CustomText>
                  )}
                  {avatarUploadStatus === 'uploading' ? (
                    <View style={[StyleSheet.absoluteFill as object, styles.avatarOverlay]}>
                      <MaterialIcons name="cloud-upload" size={26} color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
                <View style={styles.cameraBadge}>
                  <MaterialIcons name="photo-camera" size={13} color="#FFFFFF" />
                </View>
              </TVTouchable>

              {/* Name + email */}
              <CustomText style={styles.displayName} numberOfLines={2}>
                {displayName}
              </CustomText>
              {metrics.email ? (
                <CustomText style={styles.email} numberOfLines={1}>
                  {metrics.email}
                </CustomText>
              ) : null}

              {/* Member badge */}
              <View style={styles.memberBadge}>
                <MaterialIcons name="verified" size={12} color={PRIMARY} />
                <CustomText style={styles.memberBadgeText}>Member</CustomText>
              </View>
            </View>
          </FadeIn>

          {/* ── STATS CARD ── */}
          <FadeIn delay={40}>
            <View style={[styles.statsCard, { marginHorizontal: gutter }]}>
              <StatPill value={metrics.totalPlays} label="Plays" />
              <View style={styles.statDivider} />
              <StatPill value={metrics.liveSubscriptions} label="Live alerts" />
              <View style={styles.statDivider} />
              <StatPill value="" label="Active" icon="verified" iconColor={PRIMARY} />
            </View>
          </FadeIn>

          {/* ── NAVIGATION GROUPS ── */}
          <View style={[styles.navContainer, { paddingHorizontal: gutter }]}>
            {NAV_GROUPS.map((group, i) => (
              <FadeIn key={group.title} delay={80 + i * 40}>
                <NavSection group={group} />
              </FadeIn>
            ))}

            {/* ── SIGN OUT ── */}
            <FadeIn delay={200}>
              <View style={styles.signOutSection}>
                <TVTouchable
                  onPress={() => setIsLogoutSheetVisible(true)}
                  showFocusBorder={false}
                  style={styles.signOutRow}
                >
                  <View style={styles.signOutIcon}>
                    <MaterialIcons name="logout" size={19} color="#EF4444" />
                  </View>
                  <CustomText style={styles.signOutLabel}>Sign out</CustomText>
                </TVTouchable>
              </View>
            </FadeIn>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

      <ActionSheet
        visible={isAvatarSheetVisible}
        title="Change profile photo"
        actions={[
          {
            key: 'gallery',
            label: 'Choose from library',
            icon: 'photo-library',
            tone: 'accent',
            onPress: () => { void pickAvatar('gallery'); },
          },
          {
            key: 'camera',
            label: 'Take a new photo',
            icon: 'photo-camera',
            tone: 'default',
            onPress: () => { void pickAvatar('camera'); },
          },
        ]}
        onClose={() => setIsAvatarSheetVisible(false)}
      />

      <ConfirmModal
        visible={isLogoutSheetVisible}
        icon="logout"
        title="Sign out?"
        body="You can sign back in anytime. Your saved content and preferences will be waiting."
        primaryLabel="Sign out"
        primaryTone="danger"
        secondaryLabel="Stay signed in"
        loading={isSigningOut}
        onPrimary={() => { void signOut(); }}
        onDismiss={() => { if (!isSigningOut) setIsLogoutSheetVisible(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Sticky header
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  stickyHeaderInner: {
    backgroundColor: BG,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  stickyTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
  },
  toolbarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  avatarWrapper: {
    marginBottom: 20,
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: -14,
    left: -14,
    right: -14,
    bottom: -14,
    borderRadius: 80,
    backgroundColor: PRIMARY,
    opacity: 0.22,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#2D1B69',
    borderWidth: 2.5,
    borderColor: `${PRIMARY}99`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    color: '#F7F2FF',
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 52,
  },
  avatarOverlay: {
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BG,
  },
  displayName: {
    color: TEXT,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 31,
  },
  email: {
    color: TEXT_MUTED,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: `${PRIMARY}18`,
    borderWidth: 1,
    borderColor: `${PRIMARY}33`,
  },
  memberBadgeText: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: TEXT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Nav
  navContainer: {
    gap: 28,
  },
  sectionLabel: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  navCard: {
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  navRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  navHint: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 2,
  },

  // Sign out
  signOutSection: {
    borderRadius: 18,
    backgroundColor: SURFACE_ELEVATED,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  signOutIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  signOutLabel: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
});

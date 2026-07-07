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

import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { fetchUserProfileMetrics } from '../../services/supabaseAnalytics';
import { clearMobileSession } from '../../services/authService';
import { useRequireMobileSession } from './useRequireMobileSession';
import { useMediaPicker } from '../../hooks/useMediaPicker';
import { useContentUpload } from '../../hooks/useContentUpload';
import { APP_ROUTES } from '../../util/appRoutes';
import { useToast } from '../../context/ToastContext';
import type { AppTheme } from '../../theme';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// colorToken keys must exist on theme.colors
const NAV_GROUPS: {
  title: string;
  items: {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    label: string;
    hint: string;
    href: string;
    colorToken: keyof AppTheme['colors'];
  }[];
}[] = [
  {
    title: 'Your Space',
    items: [
      { icon: 'library-music', label: 'Library',          hint: 'Saved songs, videos, and playlists',      href: APP_ROUTES.tabs.library,         colorToken: 'primary'   },
      { icon: 'graphic-eq',    label: 'Music Player',     hint: 'Open the audio player and worship queue', href: APP_ROUTES.tabs.player,           colorToken: 'secondary' },
      { icon: 'smart-display', label: 'Videos',           hint: 'Watch sessions and ministry replays',     href: APP_ROUTES.tabs.videos,           colorToken: 'info'      },
      { icon: 'live-tv',       label: 'Live',             hint: 'Tune in to live ministry sessions',       href: APP_ROUTES.tabs.live,             colorToken: 'danger'    },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'tune',          label: 'Settings',         hint: 'Playback, appearance, and alerts',        href: APP_ROUTES.tabs.settings,         colorToken: 'primary'   },
      { icon: 'privacy-tip',   label: 'Privacy',          hint: 'Privacy and security controls',           href: APP_ROUTES.settingsPages.privacy, colorToken: 'success'   },
      { icon: 'verified-user', label: 'Account Security', hint: 'Email, password, and secure access',      href: APP_ROUTES.accountSecurity,       colorToken: 'warning'   },
      { icon: 'help-outline',  label: 'Help & Support',   hint: 'Get support when you need it',            href: APP_ROUTES.settingsPages.help,    colorToken: 'info'      },
    ],
  },
];

function NavRow({
  item,
  isFirst,
  theme,
}: {
  item: (typeof NAV_GROUPS)[0]['items'][0];
  isFirst: boolean;
  theme: AppTheme;
}) {
  const router = useRouter();
  const itemColor = theme.colors[item.colorToken] as string;

  return (
    <TVTouchable
      onPress={() => router.push(item.href as never)}
      style={[
        styles.navRow,
        !isFirst && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.divider },
      ]}
      showFocusBorder={false}
    >
      <View style={[styles.iconBubble, { backgroundColor: `${itemColor}18` }]}>
        <MaterialIcons name={item.icon} size={19} color={itemColor} />
      </View>
      <View style={{ flex: 1 }}>
        <CustomText style={[styles.navLabel, { color: theme.colors.text }]}>{item.label}</CustomText>
        <CustomText style={[styles.navHint, { color: theme.colors.textMuted }]} numberOfLines={1}>{item.hint}</CustomText>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
    </TVTouchable>
  );
}

function NavSection({ group, theme }: { group: (typeof NAV_GROUPS)[0]; theme: AppTheme }) {
  return (
    <View>
      <CustomText style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>{group.title}</CustomText>
      <View style={[styles.navCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primaryBorder }]}>
        {group.items.map((item, i) => (
          <NavRow key={item.label} item={item} isFirst={i === 0} theme={theme} />
        ))}
      </View>
    </View>
  );
}

function StatPill({
  value,
  label,
  icon,
  iconColor,
  theme,
}: {
  value: string | number;
  label: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  iconColor?: string;
  theme: AppTheme;
}) {
  return (
    <View style={styles.statPill}>
      {icon ? (
        <MaterialIcons name={icon} size={18} color={iconColor ?? theme.colors.primary} style={{ marginBottom: 4 }} />
      ) : (
        <CustomText style={[styles.statValue, { color: iconColor ?? theme.colors.text }]}>
          {value}
        </CustomText>
      )}
      <CustomText style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</CustomText>
    </View>
  );
}

export default function Profile() {
  const theme = useAppTheme();
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

  if (!isAuthorized) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  const displayName = metrics.displayName || metrics.email.split('@')[0] || 'Your Profile';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Sticky title — fades in as user scrolls */}
      <SafeAreaView edges={['top']} style={styles.stickyHeader} pointerEvents="none">
        <Animated.View
          style={[
            styles.stickyHeaderInner,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.divider,
            },
            { opacity: headerOpacity },
          ]}
        >
          <CustomText style={[styles.stickyTitle, { color: theme.colors.text }]}>Profile</CustomText>
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
              style={[styles.toolbarBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <MaterialIcons name="chevron-left" size={26} color={theme.colors.text} />
            </TVTouchable>

            <TVTouchable
              onPress={() => router.push(APP_ROUTES.tabs.settings)}
              showFocusBorder={false}
              style={[styles.toolbarBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <MaterialIcons name="tune" size={20} color={theme.colors.text} />
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
                    { backgroundColor: theme.colors.primary, opacity: glowPulse },
                  ]}
                />
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: `${theme.colors.primary}99`,
                    },
                  ]}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <CustomText style={[styles.avatarInitial, { color: theme.colors.text }]}>{initial}</CustomText>
                  )}
                  {avatarUploadStatus === 'uploading' ? (
                    <View style={[StyleSheet.absoluteFill as object, styles.avatarOverlay]}>
                      <MaterialIcons name="cloud-upload" size={26} color={theme.colors.textInverse} />
                    </View>
                  ) : null}
                </View>
                <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
                  <MaterialIcons name="photo-camera" size={13} color={theme.colors.textInverse} />
                </View>
              </TVTouchable>

              {/* Name + email */}
              <CustomText style={[styles.displayName, { color: theme.colors.text }]} numberOfLines={2}>
                {displayName}
              </CustomText>
              {metrics.email ? (
                <CustomText style={[styles.email, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {metrics.email}
                </CustomText>
              ) : null}

              {/* Member badge */}
              <View
                style={[
                  styles.memberBadge,
                  {
                    backgroundColor: theme.colors.primarySurface,
                    borderColor: theme.colors.primaryBorder,
                  },
                ]}
              >
                <MaterialIcons name="verified" size={12} color={theme.colors.primary} />
                <CustomText style={[styles.memberBadgeText, { color: theme.colors.primary }]}>Member</CustomText>
              </View>
            </View>
          </FadeIn>

          {/* ── STATS CARD ── */}
          <FadeIn delay={40}>
            <View
              style={[
                styles.statsCard,
                {
                  marginHorizontal: gutter,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.primaryBorder,
                },
              ]}
            >
              <StatPill value={metrics.totalPlays} label="Plays" theme={theme} />
              <View style={[styles.statDivider, { backgroundColor: theme.colors.divider }]} />
              <StatPill value={metrics.liveSubscriptions} label="Live alerts" theme={theme} />
              <View style={[styles.statDivider, { backgroundColor: theme.colors.divider }]} />
              <StatPill value="" label="Active" icon="verified" iconColor={theme.colors.primary} theme={theme} />
            </View>
          </FadeIn>

          {/* ── NAVIGATION GROUPS ── */}
          <View style={[styles.navContainer, { paddingHorizontal: gutter }]}>
            {NAV_GROUPS.map((group, i) => (
              <FadeIn key={group.title} delay={80 + i * 40}>
                <NavSection group={group} theme={theme} />
              </FadeIn>
            ))}

            {/* ── SIGN OUT ── */}
            <FadeIn delay={200}>
              <View
                style={[
                  styles.signOutSection,
                  {
                    backgroundColor: theme.colors.elevated,
                    borderColor: `${theme.colors.danger}30`,
                  },
                ]}
              >
                <TVTouchable
                  onPress={() => setIsLogoutSheetVisible(true)}
                  showFocusBorder={false}
                  style={styles.signOutRow}
                >
                  <View style={[styles.signOutIcon, { backgroundColor: `${theme.colors.danger}18` }]}>
                    <MaterialIcons name="logout" size={19} color={theme.colors.danger} />
                  </View>
                  <CustomText style={[styles.signOutLabel, { color: theme.colors.danger }]}>Sign out</CustomText>
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
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  stickyHeaderInner: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  stickyTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
  },
  avatarWrapper: {
    marginBottom: 22,
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: -14,
    left: -14,
    right: -14,
    bottom: -14,
    borderRadius: 80,
    opacity: 0.22,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 31,
  },
  email: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 22,
    marginBottom: 32,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  navContainer: {
    gap: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  navCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  navHint: {
    fontSize: 12.5,
    marginTop: 2,
  },
  signOutSection: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 17,
    paddingHorizontal: 18,
  },
  signOutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
});

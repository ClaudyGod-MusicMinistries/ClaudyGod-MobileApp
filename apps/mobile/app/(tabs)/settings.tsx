import React, { useCallback, useMemo, useState } from 'react';
import { Switch, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppModal } from '../../context/AppModalContext';
import { useAppTheme, useThemeContext } from '../../util/colorScheme';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import { useUserAccount } from '../../context/UserAccountContext';
import {
  PremiumPage,
  SectionLabel,
} from '../../components/Exp/PremiumContent';

type ThemePreference = 'system' | 'light' | 'dark';

type SettingItem = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  hint?: string;
  value: boolean;
  accent?: string;
  onToggle: (_value: boolean) => void;
};

function SettingRow({ item }: { item: SettingItem }) {
  const theme = useAppTheme();
  const device = useDeviceClass();
  const accentColor = item.accent ?? theme.colors.primary;

  return (
    <TVTouchable
      onPress={() => item.onToggle(!item.value)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: device.isTV ? 18 : 14 }}
      showFocusBorder={false}
      accessibilityRole="switch"
      accessibilityState={{ checked: item.value }}
    >
      <View
        style={{
          width: device.isTV ? 48 : 42, height: device.isTV ? 48 : 42,
          borderRadius: device.isTV ? 14 : 12, alignItems: 'center', justifyContent: 'center',
          backgroundColor: item.value
            ? `${accentColor}18`
            : theme.colors.subtleFill,
          borderWidth: 1,
          borderColor: item.value ? `${accentColor}30` : theme.colors.border,
        }}
      >
        <MaterialIcons name={item.icon} size={device.isTV ? 22 : 19} color={item.value ? accentColor : theme.colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <CustomText style={{ color: theme.colors.text, fontSize: device.isTV ? 15 : 13.5, fontWeight: '600' }}>
          {item.label}
        </CustomText>
        {item.hint ? (
          <CustomText style={{ color: theme.colors.textSecondary, fontSize: device.isTV ? 12.5 : 11.5, marginTop: 3, lineHeight: 16 }}>
            {item.hint}
          </CustomText>
        ) : null}
      </View>
      <Switch
        value={item.value}
        onValueChange={item.onToggle}
        thumbColor={theme.colors.textInverse}
        trackColor={{ false: theme.colors.border, true: `${accentColor}88` }}
        ios_backgroundColor={theme.colors.border}
      />
    </TVTouchable>
  );
}

function AppearanceCard({ value, onChange }: { value: ThemePreference; onChange: (_value: ThemePreference) => void }) {
  const theme = useAppTheme();
  const device = useDeviceClass();

  const options: { value: ThemePreference; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name']; hint: string }[] = [
    { value: 'system', label: 'System',  icon: 'devices',    hint: 'Match device setting' },
    { value: 'light',  label: 'Light',   icon: 'light-mode', hint: 'Always light' },
    { value: 'dark',   label: 'Dark',    icon: 'dark-mode',  hint: 'Always dark' },
  ];

  return (
    <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
      <SectionLabel title="Appearance" accent="Display" subtitle="Choose how the app looks on your screen" />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <TVTouchable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={{
                flex: 1, minHeight: device.isTV ? 88 : 68,
                borderRadius: theme.radius.xl, borderWidth: 1.5,
                borderColor: active ? theme.colors.primary : theme.colors.borderStrong,
                backgroundColor: active ? theme.colors.card : 'transparent',
                alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8,
              }}
              showFocusBorder={false}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View
                style={{
                  width: device.isTV ? 40 : 32, height: device.isTV ? 40 : 32,
                  borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: active ? theme.colors.elevated : 'transparent',
                }}
              >
                <MaterialIcons name={option.icon} size={device.isTV ? 22 : 18} color={active ? theme.colors.primary : theme.colors.textMuted} />
              </View>
              <CustomText style={{ color: active ? theme.colors.text : theme.colors.textSecondary, fontSize: device.isTV ? 14 : 12.5, fontWeight: active ? '700' : '500' }}>
                {option.label}
              </CustomText>
              <CustomText style={{ color: theme.colors.textMuted, fontSize: device.isTV ? 11 : 10.5, textAlign: 'center' }}>
                {option.hint}
              </CustomText>
            </TVTouchable>
          );
        })}
      </View>
    </SurfaceCard>
  );
}

function QuickLinkRow({ icon, label, hint, color, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; hint?: string; color: string; onPress: () => void }) {
  const theme = useAppTheme();
  const device = useDeviceClass();

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: device.isTV ? 16 : 14 }}>
        <View
          style={{
            width: device.isTV ? 48 : 42, height: device.isTV ? 48 : 42,
            borderRadius: device.isTV ? 14 : 12, alignItems: 'center', justifyContent: 'center',
            backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}28`,
          }}
        >
          <MaterialIcons name={icon} size={device.isTV ? 22 : 19} color={color} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText style={{ color: theme.colors.text, fontSize: device.isTV ? 15 : 13.5, fontWeight: '600' }}>
            {label}
          </CustomText>
          {hint ? <CustomText style={{ color: theme.colors.textSecondary, fontSize: device.isTV ? 12.5 : 11.5, marginTop: 2 }}>{hint}</CustomText> : null}
        </View>
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
      </View>
    </TVTouchable>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const device = useDeviceClass();
  const { themePreference, setThemePreference } = useThemeContext();
  const router = useRouter();
  const { showModal } = useAppModal();
  const { account, isSignedIn, signOut, openAccountSheet } = useUserAccount();

  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [personalization, setPersonalization] = useState(true);

  const handleAppearanceChange = useCallback((value: ThemePreference) => {
    setThemePreference(value);
    showModal({ title: 'Appearance updated', message: value === 'system' ? 'Using your device setting.' : `Using ${value} mode.`, tone: 'success', icon: 'palette' });
  }, [setThemePreference, showModal]);

  const playbackSettings: SettingItem[] = useMemo(() => [
    {
      icon: 'play-circle-outline',
      label: 'Auto-play',
      hint: 'Continue to the next song or message automatically.',
      value: autoPlay,
      accent: theme.colors.primary,
      onToggle: (v) => { setAutoPlay(v); showModal({ title: 'Playback updated', message: v ? 'Auto-play is on.' : 'Auto-play is off.', tone: 'info', icon: 'play-circle-outline' }); },
    },
    {
      icon: 'high-quality',
      label: 'High quality audio',
      hint: 'Use more data for richer listening when available.',
      value: highQuality,
      accent: theme.colors.info,
      onToggle: (v) => { setHighQuality(v); showModal({ title: 'Audio quality updated', message: v ? 'Higher quality audio is enabled.' : 'Standard quality audio is enabled.', tone: 'info', icon: 'high-quality' }); },
    },
  ], [autoPlay, highQuality, showModal, theme]);

  const experienceSettings: SettingItem[] = useMemo(() => [
    {
      icon: 'notifications-none',
      label: 'Notifications',
      hint: 'Receive live alerts and release reminders.',
      value: notifications,
      accent: theme.colors.warning,
      onToggle: (v) => { setNotifications(v); showModal({ title: 'Notifications updated', message: v ? 'Alerts are on.' : 'Alerts are off.', tone: 'info', icon: 'notifications-none' }); },
    },
    {
      icon: 'auto-awesome',
      label: 'Recommendations',
      hint: 'Use listening activity to improve suggestions.',
      value: personalization,
      accent: theme.colors.success,
      onToggle: (v) => { setPersonalization(v); showModal({ title: 'Recommendations updated', message: v ? 'Recommendations are personalized.' : 'Personalization is off.', tone: 'info', icon: 'auto-awesome' }); },
    },
  ], [notifications, personalization, showModal, theme]);

  const isWideLayout = device.isDesktop || device.isTV;

  return (
    <PremiumPage
      title="Settings"
      eyebrow="Your app"
      noBack
      rightAction={
        <AppButton
          title=""
          variant="secondary"
          size="sm"
          onPress={() => router.push(APP_ROUTES.tabs.home)}
          style={{ minWidth: 40, paddingHorizontal: 10 }}
          leftIcon={<MaterialIcons name="home-filled" size={16} color={theme.colors.text} />}
        />
      }
    >
      {/* Identity / Account card */}
      <SurfaceCard tone="strong" style={{ padding: device.isTV ? 20 : 16 }}>
        <View style={{ flexDirection: isWideLayout ? 'row' : 'column', gap: isWideLayout ? 20 : 16, alignItems: isWideLayout ? 'center' : 'flex-start' }}>
          <View
            style={{
              width: device.isTV ? 72 : 56, height: device.isTV ? 72 : 56,
              borderRadius: device.isTV ? 22 : 18, alignItems: 'center', justifyContent: 'center',
              backgroundColor: isSignedIn ? theme.colors.primarySurface : theme.colors.card,
              borderWidth: 2,
              borderColor: isSignedIn ? theme.colors.primaryBorder : theme.colors.borderStrong,
            }}
          >
            <MaterialIcons
              name={isSignedIn ? 'person' : 'headphones'}
              size={device.isTV ? 34 : 26}
              color={theme.colors.primary}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <CustomText style={{ color: theme.colors.text, fontSize: device.isTV ? 20 : 16, fontWeight: '700', letterSpacing: -0.3 }}>
              {isSignedIn ? account!.displayName : 'ClaudyGod Listener'}
            </CustomText>
            <CustomText style={{ color: theme.colors.textSecondary, fontSize: device.isTV ? 13 : 12, marginTop: 3 }}>
              {isSignedIn ? account!.email : 'Worship freely — no account required'}
            </CustomText>
          </View>
        </View>

        {/* Account actions */}
        <View style={{ marginTop: 14, gap: 8, flexDirection: isWideLayout ? 'row' : 'column' }}>
          {isSignedIn ? (
            <AppButton
              title="Sign out"
              variant="outline"
              size="sm"
              onPress={() => {
                void signOut();
                showModal({ title: 'Signed out', message: 'Your local library is still saved on this device.', tone: 'info', icon: 'logout' });
              }}
              leftIcon={<MaterialIcons name="logout" size={14} color={theme.colors.primary} />}
            />
          ) : (
            <AppButton
              title="Sync your library"
              size="sm"
              onPress={openAccountSheet}
              leftIcon={<MaterialIcons name="sync" size={14} color="#FFFFFF" />}
            />
          )}
        </View>
      </SurfaceCard>

      {/* Quick links */}
      <View style={{ gap: 12 }}>
        <SectionLabel title="Quick access" accent="Navigate" />
        <View style={{ flexDirection: isWideLayout ? 'row' : 'column', gap: isWideLayout ? 12 : 0 }}>
          <View style={isWideLayout ? { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border } : {}}>
            <SurfaceCard tone="subtle" style={{ paddingHorizontal: theme.spacing.md, paddingVertical: 0 }}>
              {[
                { icon: 'library-music' as const, label: 'Library',  hint: 'Saved content', color: theme.colors.primary, onPress: () => router.push(APP_ROUTES.tabs.library) },
                { icon: 'search'        as const, label: 'Search',   hint: 'Find songs, videos, and live', color: theme.colors.success, onPress: () => router.push(APP_ROUTES.tabs.search) },
              ].map((link, idx) => (
                <View key={link.label} style={{ borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: theme.colors.border }}>
                  <QuickLinkRow {...link} />
                </View>
              ))}
            </SurfaceCard>
          </View>
          <View style={isWideLayout ? { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border } : {}}>
            <SurfaceCard tone="subtle" style={{ paddingHorizontal: theme.spacing.md, paddingVertical: 0 }}>
              {[
                { icon: 'card-giftcard'      as const, label: 'Invite friends', hint: 'Earn rewards together', color: theme.colors.primary, onPress: () => router.push(APP_ROUTES.settingsPages.referral) },
                { icon: 'help-outline'       as const, label: 'Help',           hint: 'Get support',           color: theme.colors.info,    onPress: () => router.push(APP_ROUTES.settingsPages.help) },
                { icon: 'volunteer-activism' as const, label: 'Support',        hint: 'Give or donate',        color: theme.colors.danger,  onPress: () => router.push(APP_ROUTES.settingsPages.donate) },
              ].map((link, idx) => (
                <View key={link.label} style={{ borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: theme.colors.border }}>
                  <QuickLinkRow {...link} />
                </View>
              ))}
            </SurfaceCard>
          </View>
        </View>
      </View>

      {/* Appearance */}
      <AppearanceCard value={themePreference} onChange={handleAppearanceChange} />

      {/* Settings groups */}
      <View style={{ flexDirection: isWideLayout ? 'row' : 'column', gap: 12, alignItems: 'flex-start' }}>
        <SurfaceCard tone="subtle" style={{ flex: 1, paddingHorizontal: theme.spacing.md, paddingVertical: 0 }}>
          <View style={{ paddingTop: 14, paddingBottom: 6 }}>
            <CustomText style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase' }}>
              Playback
            </CustomText>
          </View>
          {playbackSettings.map((item, index) => (
            <View key={item.label} style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: theme.colors.border }}>
              <SettingRow item={item} />
            </View>
          ))}
        </SurfaceCard>

        <SurfaceCard tone="subtle" style={{ flex: 1, paddingHorizontal: theme.spacing.md, paddingVertical: 0 }}>
          <View style={{ paddingTop: 14, paddingBottom: 6 }}>
            <CustomText style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase' }}>
              Experience
            </CustomText>
          </View>
          {experienceSettings.map((item, index) => (
            <View key={item.label} style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: theme.colors.border }}>
              <SettingRow item={item} />
            </View>
          ))}
        </SurfaceCard>
      </View>
    </PremiumPage>
  );
}

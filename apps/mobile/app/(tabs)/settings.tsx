import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Switch, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AppIcon, type AppIconName } from '../../components/ui/AppIcon';
import { useAppModal } from '../../context/AppModalContext';
import { useAppTheme, useThemeContext } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { APP_ROUTES, APP_ROUTE_BY_ID, type AppRouteId } from '../../util/appRoutes';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { usePushNotifications } from '../../hooks/usePushNotify';
import { getSettingsHubSections } from '../../util/mobileExperienceConfig';
import { getPreference, setPreference } from '../../lib/localUserStorage';
import { setDiagnosticsAllowed } from '../../lib/sentry';
import { PremiumPage } from '../../components/feed';

type TogglePreferenceKey = 'notificationsEnabled' | 'autoplayEnabled' | 'highQualityEnabled' | 'personalizationEnabled' | 'diagnosticsEnabled';

const DEVICE_DEFAULTS: Record<TogglePreferenceKey, boolean> = {
  notificationsEnabled: true,
  autoplayEnabled: true,
  highQualityEnabled: false,
  personalizationEnabled: true,
  diagnosticsEnabled: true,
};

// Fallback-only — used before admin config has loaded, or if it's ever empty.
// Mirrors the same defaults now configurable via admin's Mobile config → Settings hub.
const DEFAULT_QUICK_ACCESS_SECTIONS: {
  id: string;
  title: string;
  items: { id: string; icon: string; label: string; hint: string; destination: AppRouteId }[];
}[] = [
  {
    id: 'quick-access', title: '',
    items: [
      { id: 'library', icon: 'library-music', label: 'Library', hint: 'Saved content', destination: 'tabs.library' },
      { id: 'search', icon: 'search', label: 'Search', hint: 'Find songs, videos, and live', destination: 'tabs.search' },
    ],
  },
  {
    id: 'support', title: '',
    items: [
      { id: 'referral', icon: 'card-giftcard', label: 'Invite friends', hint: 'Earn rewards together', destination: 'settings.referral' },
      { id: 'help', icon: 'help-outline', label: 'Help', hint: 'Get support', destination: 'settings.help' },
      { id: 'donate', icon: 'volunteer-activism', label: 'Support', hint: 'Give or donate', destination: 'settings.donate' },
    ],
  },
];

const QUICK_LINK_PALETTE_KEYS = ['primary', 'success', 'info', 'danger'] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemePreference = 'system' | 'light' | 'dark';

type SettingItem = {
  icon: AppIconName;
  label: string;
  hint?: string;
  value: boolean;
  accent?: string;
  onToggle: (_value: boolean) => void;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  settingRowTouch:  { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68 },
  settingIcon: {
    width: 34, height: 34, borderRadius: theme.radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill,
  },
  settingTextWrap:  { flex: 1 },
  settingLabel:     { color: theme.colors.text, fontWeight: '600' },
  settingHint:      { color: theme.colors.textMuted, marginTop: 3, lineHeight: 16 },

  sectionShell: {
    borderRadius: theme.radius.card, overflow: 'hidden',
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 11 },
  sectionTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  sectionSubtitle: { color: theme.colors.textMuted, fontSize: 11.5, marginTop: 3 },
  sectionBody: { paddingHorizontal: 16 },

  appearanceRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.colors.border },
  appearanceOption: { flex: 1, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10 },
  appearanceOptionBorder: { borderLeftWidth: 1, borderLeftColor: theme.colors.border },
  appearanceIndicator: { position: 'absolute', left: 12, right: 12, bottom: 0, height: 2, borderRadius: 1, backgroundColor: theme.colors.primary },

  linkRow:          { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 62, paddingHorizontal: 14 },
  linkIcon: { width: 32, height: 32, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  linkLabelWrap:    { flex: 1, minWidth: 0 },
  linkLabel:        { color: theme.colors.text, fontWeight: '600' },
  linkHint:         { color: theme.colors.textMuted, marginTop: 2 },

  intro: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 2 },
  introIcon: { width: 44, height: 44, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  introCopy: { flex: 1, minWidth: 0 },
  introTitle: { color: theme.colors.text, fontWeight: '700', fontSize: 16 },
  introSubtitle: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: theme.colors.border },
  quickCell: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rowDivider:       { borderTopColor: theme.colors.border },
  settingsGroupsRow:{ gap: 12 },
  homeBtn:          { minWidth: 40, paddingHorizontal: 10 },
  settingsGroupCard: { flex: 1 },
}));

// ─── SettingRow ───────────────────────────────────────────────────────────────

function SettingRow({ item }: { item: SettingItem }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const accentColor = item.accent ?? theme.colors.primary;

  return (
    <TVTouchable
      onPress={() => item.onToggle(!item.value)}
      style={[styles.settingRowTouch, { paddingVertical: device.isTV ? 14 : 10 }]}
      showFocusBorder={false}
      accessibilityRole="switch"
      accessibilityState={{ checked: item.value }}
    >
      <View style={[styles.settingIcon, item.value ? { backgroundColor: `${accentColor}14` } : null]}>
        <AppIcon name={item.icon} size={device.isTV ? 20 : 18} color={item.value ? accentColor : theme.colors.textMuted} />
      </View>
      <View style={styles.settingTextWrap}>
        <CustomText style={[styles.settingLabel, { fontSize: device.isTV ? 15.5 : 14 }]}>
          {item.label}
        </CustomText>
        {item.hint ? (
          <CustomText style={[styles.settingHint, { fontSize: device.isTV ? 13 : 12 }]}>
            {item.hint}
          </CustomText>
        ) : null}
      </View>
      <Switch
        value={item.value}
        onValueChange={item.onToggle}
        thumbColor={item.value ? theme.colors.onPrimary : theme.colors.textMuted}
        trackColor={{ false: theme.colors.subtleFillMed, true: accentColor }}
        ios_backgroundColor={theme.colors.border}
      />
    </TVTouchable>
  );
}

// ─── AppearanceCard ───────────────────────────────────────────────────────────

function AppearanceCard({ value, onChange }: { value: ThemePreference; onChange: (_value: ThemePreference) => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();

  const options: { value: ThemePreference; label: string; icon: AppIconName; hint: string }[] = [
    { value: 'system', label: 'System', icon: 'devices', hint: 'Device' },
    { value: 'light', label: 'Light', icon: 'sun', hint: 'Light mode' },
    { value: 'dark', label: 'Dark', icon: 'moon', hint: 'Dark mode' },
  ];

  return (
    <View style={styles.sectionShell}>
      <View style={styles.sectionHeader}>
        <CustomText style={styles.sectionTitle}>Appearance</CustomText>
        <CustomText style={styles.sectionSubtitle}>Choose how ClaudyGod looks on this device</CustomText>
      </View>
      <View style={styles.appearanceRow}>
        {options.map((option, index) => {
          const active = value === option.value;
          return (
            <TVTouchable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.appearanceOption, index > 0 ? styles.appearanceOptionBorder : null, active ? { backgroundColor: theme.colors.primarySurface } : null]}
              showFocusBorder={false}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <AppIcon name={option.icon} size={device.isTV ? 22 : 19} color={active ? theme.colors.primary : theme.colors.textSecondary} />
              <CustomText
                style={{
                  color: active ? theme.colors.text : theme.colors.textSecondary,
                  fontSize: device.isTV ? 14 : 12.5,
                  fontWeight: active ? '700' : '600',
                }}
              >
                {option.label}
              </CustomText>
              <CustomText style={{ color: theme.colors.textMuted, fontSize: device.isTV ? 11 : 10, textAlign: 'center' }}>
                {option.hint}
              </CustomText>
              {active ? <View style={styles.appearanceIndicator} /> : null}
            </TVTouchable>
          );
        })}
      </View>
    </View>
  );
}

// ─── QuickLinkRow ─────────────────────────────────────────────────────────────

function QuickLinkRow({ icon, label, hint, color, onPress }: { icon: AppIconName; label: string; hint?: string; color: string; onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={[styles.linkRow, { paddingVertical: device.isTV ? 12 : 8 }]}> 
        <View style={[styles.linkIcon, { backgroundColor: `${color}12` }]}> 
          <AppIcon name={icon} size={device.isTV ? 20 : 17} color={color} />
        </View>
        <View style={styles.linkLabelWrap}>
          <CustomText style={[styles.linkLabel, { fontSize: device.isTV ? 15.5 : 14 }]}>
            {label}
          </CustomText>
          {hint ? (
            <CustomText style={[styles.linkHint, { fontSize: device.isTV ? 13 : 12 }]}>
              {hint}
            </CustomText>
          ) : null}
        </View>
        <AppIcon name="chevron-right" size={17} color={theme.colors.textMuted} />
      </View>
    </TVTouchable>
  );
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const { themePreference, setThemePreference } = useThemeContext();
  const router = useRouter();
  const { showModal } = useAppModal();
  const { config: appConfig } = useMobileAppConfig();
  const { toggleNotifications, hasPermission: pushPermissionGranted, isLoading: pushLoading } = usePushNotifications();

  const settingsHubSections = useMemo(() => {
    const configured = getSettingsHubSections(appConfig);
    return configured.length ? configured : DEFAULT_QUICK_ACCESS_SECTIONS;
  }, [appConfig]);

  const [notifications,   setNotifications]   = useState(true);
  const [autoPlay,        setAutoPlay]         = useState(true);
  const [highQuality,     setHighQuality]      = useState(false);
  const [personalization, setPersonalization]  = useState(true);
  const [diagnostics,      setDiagnostics]     = useState(true);
  const [awaitingPushPermission, setAwaitingPushPermission] = useState(false);

  // The mobile app has no public account system. Preferences are device-local.
  useEffect(() => {
    let cancelled = false;

    const applyValues = (prefs: Record<TogglePreferenceKey, boolean>) => {
      if (cancelled) return;
      setNotifications(prefs.notificationsEnabled);
      setAutoPlay(prefs.autoplayEnabled);
      setHighQuality(prefs.highQualityEnabled);
      setPersonalization(prefs.personalizationEnabled);
      setDiagnostics(prefs.diagnosticsEnabled);
      setDiagnosticsAllowed(prefs.diagnosticsEnabled);
    };

    Promise.all(
      (Object.keys(DEVICE_DEFAULTS) as TogglePreferenceKey[]).map(async (key) => [
        key,
        await getPreference(key, DEVICE_DEFAULTS[key]),
      ] as const),
    ).then((entries) => applyValues(Object.fromEntries(entries) as Record<TogglePreferenceKey, boolean>));

    return () => { cancelled = true; };
  }, []);

  const persistPreference = useCallback(async (key: TogglePreferenceKey, value: boolean) => {
    // Mirrored to local storage regardless of account status, so lib/sentry.ts's
    // boot-time read always has the latest value without needing an account.
    await setPreference(key, value);
    if (key === 'diagnosticsEnabled') setDiagnosticsAllowed(value);
  }, []);

  // Fires only right after the user explicitly turns notifications on (armed by
  // `awaitingPushPermission` in that toggle's handler below) — not a passive
  // watcher, since `hasPermission` starts false for every fresh install until
  // the OS prompt has actually been answered, and we don't want to silently
  // flip a brand-new user's default-on preference back off before they've
  // ever been asked.
  useEffect(() => {
    if (!awaitingPushPermission || pushLoading) return;
    setAwaitingPushPermission(false);
    if (!pushPermissionGranted) {
      setNotifications(false);
      void persistPreference('notificationsEnabled', false);
      showModal({
        title: 'Permission needed',
        message: 'Enable notifications for ClaudyGod in your device settings to receive alerts.',
        tone: 'warning',
        icon: 'notifications-none',
      });
    }
  }, [awaitingPushPermission, pushLoading, pushPermissionGranted, persistPreference, showModal]);

  const handleAppearanceChange = useCallback((value: ThemePreference) => {
    setThemePreference(value);
    showModal({ title: 'Appearance updated', message: value === 'system' ? 'Using your device setting.' : `Using ${value} mode.`, tone: 'success', icon: 'palette' });
  }, [setThemePreference, showModal]);

  const makeToggleHandler = useCallback(
    (key: TogglePreferenceKey, apply: (_value: boolean) => void, messages: { on: string; off: string; title: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }) =>
      (value: boolean) => {
        apply(value);
        persistPreference(key, value)
          .then(() => showModal({ title: messages.title, message: value ? messages.on : messages.off, tone: 'info', icon: messages.icon }))
          .catch(() => {
            apply(!value);
            showModal({ title: 'Update failed', message: 'Could not save this setting. Please try again.', tone: 'error', icon: messages.icon });
          });
      },
    [persistPreference, showModal],
  );

  const playbackSettings: SettingItem[] = useMemo(() => [
    {
      icon: 'play-circle-outline',
      label: 'Auto-play',
      hint: 'Continue to the next song or message automatically.',
      value: autoPlay,
      accent: theme.colors.primary,
      onToggle: makeToggleHandler('autoplayEnabled', setAutoPlay, { title: 'Playback updated', on: 'Auto-play is on.', off: 'Auto-play is off.', icon: 'play-circle-outline' }),
    },
    {
      icon: 'high-quality',
      label: 'High quality audio',
      hint: 'Use more data for richer listening when available.',
      value: highQuality,
      accent: theme.colors.info,
      onToggle: makeToggleHandler('highQualityEnabled', setHighQuality, { title: 'Audio quality updated', on: 'Higher quality audio is enabled.', off: 'Standard quality audio is enabled.', icon: 'high-quality' }),
    },
  ], [autoPlay, highQuality, makeToggleHandler, theme]);

  const experienceSettings: SettingItem[] = useMemo(() => [
    {
      icon: 'notifications-none',
      label: 'Notifications',
      hint: 'Receive live alerts and release reminders.',
      value: notifications,
      accent: theme.colors.warning,
      onToggle: (value: boolean) => {
        makeToggleHandler('notificationsEnabled', setNotifications, { title: 'Notifications updated', on: 'Alerts are on.', off: 'Alerts are off.', icon: 'notifications-none' })(value);
        if (value) setAwaitingPushPermission(true);
        void toggleNotifications(value);
      },
    },
    {
      icon: 'auto-awesome',
      label: 'Recommendations',
      hint: 'Use listening activity to improve suggestions.',
      value: personalization,
      accent: theme.colors.success,
      onToggle: makeToggleHandler('personalizationEnabled', setPersonalization, { title: 'Recommendations updated', on: 'Recommendations are personalized.', off: 'Personalization is off.', icon: 'auto-awesome' }),
    },
    {
      icon: 'bug-report',
      label: 'Diagnostics',
      hint: 'Share crash and error reports to help us fix problems faster.',
      value: diagnostics,
      accent: theme.colors.textSecondary,
      onToggle: makeToggleHandler('diagnosticsEnabled', setDiagnostics, { title: 'Diagnostics updated', on: 'Crash reports are shared.', off: 'Crash reports are off.', icon: 'bug-report' }),
    },
  ], [notifications, personalization, diagnostics, makeToggleHandler, theme, toggleNotifications]);

  const isWideLayout = device.isDesktop || device.isTV;
  const quickItems = settingsHubSections.flatMap((section) => section.items);
  const quickColumns = isWideLayout ? Math.min(3, Math.max(2, quickItems.length)) : 1;
  const quickCellWidth = `${100 / quickColumns}%` as `${number}%`;

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
          style={styles.homeBtn}
          leftIcon={<AppIcon name="home" size={16} color={theme.colors.text} />}
        />
      }
    >
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <AppIcon name="sliders" size={21} color={theme.colors.primary} />
        </View>
        <View style={styles.introCopy}>
          <CustomText style={styles.introTitle}>Make the app yours</CustomText>
          <CustomText style={styles.introSubtitle}>Control playback, recommendations, privacy, and display.</CustomText>
        </View>
      </View>

      <AppearanceCard value={themePreference} onChange={handleAppearanceChange} />

      <View style={[styles.settingsGroupsRow, { flexDirection: isWideLayout ? 'row' : 'column', alignItems: isWideLayout ? 'flex-start' : 'stretch' }]}> 
        <View style={[styles.sectionShell, styles.settingsGroupCard]}>
          <View style={styles.sectionHeader}>
            <CustomText style={styles.sectionTitle}>Playback</CustomText>
            <CustomText style={styles.sectionSubtitle}>Listening quality and queue behavior</CustomText>
          </View>
          <View style={styles.sectionBody}>
            {playbackSettings.map((item) => (
              <View key={item.label} style={[styles.rowDivider, { borderTopWidth: 1 }]}><SettingRow item={item} /></View>
            ))}
          </View>
        </View>

        <View style={[styles.sectionShell, styles.settingsGroupCard]}>
          <View style={styles.sectionHeader}>
            <CustomText style={styles.sectionTitle}>Experience & privacy</CustomText>
            <CustomText style={styles.sectionSubtitle}>Alerts, personalization, and diagnostics</CustomText>
          </View>
          <View style={styles.sectionBody}>
            {experienceSettings.map((item) => (
              <View key={item.label} style={[styles.rowDivider, { borderTopWidth: 1 }]}><SettingRow item={item} /></View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.sectionShell}>
        <View style={styles.sectionHeader}>
          <CustomText style={styles.sectionTitle}>More</CustomText>
          <CustomText style={styles.sectionSubtitle}>Library, support, giving, and other destinations</CustomText>
        </View>
        <View style={styles.quickGrid}>
          {quickItems.map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.quickCell,
                { width: quickCellWidth },
                isWideLayout && idx % quickColumns !== 0 ? { borderLeftWidth: 1, borderLeftColor: theme.colors.border } : null,
              ]}
            >
              <QuickLinkRow
                icon={item.icon}
                label={item.label}
                hint={item.hint}
                color={theme.colors[QUICK_LINK_PALETTE_KEYS[idx % QUICK_LINK_PALETTE_KEYS.length]!]} 
                onPress={() => router.push((APP_ROUTE_BY_ID[item.destination as AppRouteId] ?? APP_ROUTES.tabs.settings) as never)}
              />
            </View>
          ))}
        </View>
      </View>
    </PremiumPage>
  );
}

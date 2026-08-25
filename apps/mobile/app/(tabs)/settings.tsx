import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Switch, View } from 'react-native';
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
import { getStoredMobileSession } from '../../services/authService';
import { fetchInstallationPreferences, fetchMePreferences, updateInstallationNotifications, updateInstallationPersonalization, updateMePreferences, type MePreferences } from '../../services/userFlowService';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';
import { useQueryClient } from '@tanstack/react-query';

type TogglePreferenceKey = 'notificationsEnabled' | 'autoplayEnabled' | 'highQualityEnabled' | 'personalizationEnabled' | 'diagnosticsEnabled';

const DEVICE_DEFAULTS: Record<TogglePreferenceKey, boolean> = {
  notificationsEnabled: false,
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
  {
    id: 'product-legal', title: '',
    items: [
      { id: 'privacy-controls', icon: 'privacy-tip', label: 'Privacy & security', hint: 'Manage privacy controls', destination: 'settings.privacy' },
      { id: 'privacy-policy', icon: 'policy', label: 'Privacy Policy', hint: 'How ClaudyGod handles data', destination: 'settings.privacyPolicy' },
      { id: 'terms', icon: 'gavel', label: 'Terms of Service', hint: 'Rules for using ClaudyGod', destination: 'settings.terms' },
      { id: 'about', icon: 'info-outline', label: 'About', hint: 'Product and ministry information', destination: 'settings.about' },
      { id: 'rate', icon: 'star-outline', label: 'Rate the app', hint: 'Share product feedback', destination: 'settings.rate' },
    ],
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemePreference = 'system' | 'light' | 'dark';

type ToggleSettingItem = {
  kind: 'toggle';
  icon: AppIconName;
  label: string;
  hint?: string;
  value: boolean;
  onToggle: (_value: boolean) => void;
};

type StatusSettingItem = {
  kind: 'status';
  icon: AppIconName;
  label: string;
  hint: string;
  statusLabel: string;
};

type SettingItem = ToggleSettingItem | StatusSettingItem;

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  settingRowTouch:  { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68 },
  settingIcon: {
    width: 40, height: 40, borderRadius: theme.radius.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  settingTextWrap:  { flex: 1 },
  settingLabel:     { color: theme.colors.text, fontWeight: '600' },
  settingHint:      { color: theme.colors.textMuted, marginTop: 3, lineHeight: 16 },
  settingStatus: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.radius.pill, backgroundColor: theme.colors.infoSurface, borderWidth: 1, borderColor: theme.colors.infoBorder },
  settingStatusText: { color: theme.colors.info, fontWeight: '700' },

  sectionShell: {
    borderRadius: theme.radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    ...theme.shadows.sm,
  },
  sectionHeader: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  sectionHeaderIcon: {
    width: 38, height: 38, borderRadius: theme.radius.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
  },
  sectionHeaderCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  sectionSubtitle: { color: theme.colors.textMuted, fontSize: 11.5, marginTop: 3 },
  sectionBody: { paddingHorizontal: 16 },

  appearanceRow: { flexDirection: 'row', gap: theme.spacing.xs, padding: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  appearanceOption: { flex: 1, minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs, padding: theme.spacing.sm, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  appearanceOptionBorder: { borderLeftWidth: 1, borderLeftColor: theme.colors.border },
  appearanceIndicator: { position: 'absolute', left: theme.spacing.sm, right: theme.spacing.sm, bottom: theme.spacing.xs, height: 3, borderRadius: 2, backgroundColor: theme.colors.primary },

  linkRow:          { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 62, paddingHorizontal: 14 },
  linkIcon: { width: 38, height: 38, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  linkLabelWrap:    { flex: 1, minWidth: 0 },
  linkLabel:        { color: theme.colors.text, fontWeight: '600' },
  linkHint:         { color: theme.colors.textMuted, marginTop: 2 },

  introCard: { padding: theme.spacing.lg, gap: theme.spacing.lg, borderColor: theme.colors.primaryBorder, ...theme.shadows.md },
  intro: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  introIcon: { width: 58, height: 58, borderRadius: theme.radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  introLogo: { width: 42, height: 42, borderRadius: theme.radius.lg },
  introCopy: { flex: 1, minWidth: 0 },
  introTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 19, marginTop: theme.spacing.xxs },
  introSubtitle: { color: theme.colors.textSecondary, fontSize: 13, marginTop: theme.spacing.xs, lineHeight: 19 },
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
  const accentColor = theme.colors.primary;

  const isToggle = item.kind === 'toggle';
  const isEnabled = isToggle && item.value;
  return (
    <TVTouchable
      onPress={isToggle ? () => item.onToggle(!item.value) : undefined}
      style={[styles.settingRowTouch, { paddingVertical: device.isTV ? 14 : 10 }]}
      showFocusBorder={false}
      accessibilityRole={isToggle ? 'switch' : 'text'}
      accessibilityState={isToggle ? { checked: item.value } : undefined}
    >
      <View style={[styles.settingIcon, isEnabled ? { backgroundColor: theme.colors.primarySurface, borderColor: theme.colors.primaryBorder } : null]}>
        <AppIcon name={item.icon} size={device.isTV ? 20 : 18} color={isToggle ? (item.value ? accentColor : theme.colors.textMuted) : theme.colors.info} />
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
      {isToggle ? (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          thumbColor={item.value ? theme.colors.onPrimary : theme.colors.textMuted}
          trackColor={{ false: theme.colors.subtleFillMed, true: accentColor }}
          ios_backgroundColor={theme.colors.border}
        />
      ) : (
        <View style={styles.settingStatus}><CustomText variant="caption" style={styles.settingStatusText}>{item.statusLabel}</CustomText></View>
      )}
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
      <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
        <View style={styles.sectionHeaderIcon}><AppIcon name="palette" size={19} color={theme.colors.primary} /></View>
        <View style={styles.sectionHeaderCopy}>
          <CustomText style={styles.sectionTitle}>Appearance</CustomText>
          <CustomText style={styles.sectionSubtitle}>Choose how ClaudyGod looks on this device</CustomText>
        </View>
      </View>
      <View style={styles.appearanceRow}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <TVTouchable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.appearanceOption, active ? { backgroundColor: theme.colors.primarySurface, borderColor: theme.colors.primaryFocusBorder } : null]}
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

function QuickLinkRow({ icon, label, hint, color, surface, border, onPress }: { icon: AppIconName; label: string; hint?: string; color: string; surface: string; border: string; onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={[styles.linkRow, { paddingVertical: device.isTV ? 12 : 8 }]}> 
        <View style={[styles.linkIcon, { backgroundColor: surface, borderColor: border }]}>
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
  const queryClient = useQueryClient();
  const { showModal } = useAppModal();
  const { config: appConfig } = useMobileAppConfig();
  const { toggleNotifications, hasPermission: pushPermissionGranted, isLoading: pushLoading } = usePushNotifications();

  const settingsHubSections = useMemo(() => {
    const configured = getSettingsHubSections(appConfig);
    return configured.length ? configured : DEFAULT_QUICK_ACCESS_SECTIONS;
  }, [appConfig]);

  const [notifications,   setNotifications]   = useState(true);
  const [autoPlay,        setAutoPlay]         = useState(true);
  const [personalization, setPersonalization]  = useState(true);
  const [diagnostics,      setDiagnostics]     = useState(true);
  const [accountConnected, setAccountConnected] = useState(false);

  // The mobile app has no public account system. Preferences are device-local.
  useEffect(() => {
    let cancelled = false;

    const applyValues = (prefs: Record<TogglePreferenceKey, boolean>) => {
      if (cancelled) return;
      setNotifications(prefs.notificationsEnabled);
      setAutoPlay(prefs.autoplayEnabled);
      setPersonalization(prefs.personalizationEnabled);
      setDiagnostics(prefs.diagnosticsEnabled);
      setDiagnosticsAllowed(prefs.diagnosticsEnabled);
    };

    const loadPreferences = async () => {
      const entries = await Promise.all(
        (Object.keys(DEVICE_DEFAULTS) as TogglePreferenceKey[]).map(async (key) => [
          key,
          await getPreference(key, DEVICE_DEFAULTS[key]),
        ] as const),
      );
      const localPreferences = Object.fromEntries(entries) as Record<TogglePreferenceKey, boolean>;
      const { user } = await getStoredMobileSession();
      if (!cancelled) setAccountConnected(Boolean(user));
      if (!user) {
        try {
          const installation = await fetchInstallationPreferences();
          const resolved = { ...localPreferences, personalizationEnabled: installation.preferences.personalizationEnabled, notificationsEnabled: installation.preferences.notificationsEnabled };
          applyValues(resolved);
          await setPreference('personalizationEnabled', resolved.personalizationEnabled);
        } catch {
          applyValues(localPreferences);
        }
        return;
      }

      try {
        const { preferences } = await fetchMePreferences();
        applyValues(preferences);
        setThemePreference(preferences.themePreference);
        await Promise.all([
          ...(Object.keys(DEVICE_DEFAULTS) as TogglePreferenceKey[])
            .map((key) => setPreference(key, preferences[key])),
          setPreference('themePreference', preferences.themePreference),
        ]);
      } catch {
        // The device cache remains the offline fallback; authenticated writes
        // still require a server acknowledgement before success is shown.
        applyValues(localPreferences);
      }
    };
    void loadPreferences();

    return () => { cancelled = true; };
  }, [setThemePreference]);

  const persistPreference = useCallback(async (key: TogglePreferenceKey, value: boolean) => {
    const { user } = await getStoredMobileSession();
    if (user) {
      await updateMePreferences({ [key]: value } as Partial<MePreferences>);
    } else if (key === 'personalizationEnabled') {
      await updateInstallationPersonalization(value);
    } else if (key === 'notificationsEnabled') {
      await updateInstallationNotifications(value);
    }
    // Keep an offline cache after the authoritative server write succeeds.
    await setPreference(key, value);
    if (key === 'diagnosticsEnabled') setDiagnosticsAllowed(value);
  }, []);

  const handleNotificationsChange = useCallback((value: boolean) => {
    if (pushLoading) return;
    const previous = notifications;
    void (async () => {
      const providerReady = await toggleNotifications(value);
      if (!providerReady) {
        setNotifications(previous);
        showModal({
          title: 'Push notifications unavailable',
          message: 'Use a ClaudyGod development or store build on a physical device and allow notifications in system settings.',
          tone: 'warning', icon: 'notifications-none',
        });
        return;
      }
      try {
        await persistPreference('notificationsEnabled', value);
        setNotifications(value);
        showModal({
          title: value ? 'Push delivery active' : 'Push delivery stopped',
          message: value ? 'This device is registered for enabled live and release alerts.' : 'This device was removed from push delivery.',
          tone: 'success', icon: value ? 'notifications-active' : 'notifications-none',
        });
      } catch {
        setNotifications(previous);
        showModal({ title: 'Notification update failed', message: 'The backend did not confirm this change. Please try again.', tone: 'error', icon: 'notifications-none' });
      }
    })();
  }, [notifications, persistPreference, pushLoading, showModal, toggleNotifications]);

  const handleAppearanceChange = useCallback((value: ThemePreference) => {
    const previous = themePreference;
    setThemePreference(value);
    void (async () => {
      try {
        const { user } = await getStoredMobileSession();
        if (user) await updateMePreferences({ themePreference: value });
        await setPreference('themePreference', value);
        showModal({ title: 'Appearance updated', message: value === 'system' ? 'Using your device setting.' : `Using ${value} mode.`, tone: 'success' });
      } catch {
        setThemePreference(previous);
        showModal({ title: 'Update failed', message: 'Your appearance preference could not be synchronized. Please try again.', tone: 'error' });
      }
    })();
  }, [setThemePreference, showModal, themePreference]);

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
      kind: 'toggle',
      icon: 'play-circle-outline',
      label: 'Auto-play',
      hint: 'Continue to the next song or message automatically.',
      value: autoPlay,
      onToggle: makeToggleHandler('autoplayEnabled', setAutoPlay, { title: 'Playback updated', on: 'Auto-play is on.', off: 'Auto-play is off.', icon: 'play-circle-outline' }),
    },
    {
      kind: 'status',
      icon: 'high-quality',
      label: 'Audio quality',
      hint: 'Uses the publisher’s source quality. YouTube streams adapt automatically to the connection.',
      statusLabel: 'Adaptive',
    },
  ], [autoPlay, makeToggleHandler]);

  const experienceSettings: SettingItem[] = useMemo(() => [
    {
      kind: 'toggle',
      icon: 'notifications-none',
      label: 'Notifications',
      hint: pushLoading ? 'Checking device and delivery registration…' : notifications && pushPermissionGranted ? 'Push delivery is active for this device.' : 'Register this device for live and release push alerts.',
      value: notifications,
      onToggle: handleNotificationsChange,
    },
    {
      kind: 'status',
      icon: 'email',
      label: 'Email delivery',
      hint: accountConnected ? 'Verified account and security emails are delivered through the transactional email worker.' : 'Guest mode has no verified email address. Support replies use the email supplied with each request.',
      statusLabel: accountConnected ? 'Verified account' : 'Guest workflow',
    },
    {
      kind: 'toggle',
      icon: 'auto-awesome',
      label: 'Recommendations',
      hint: accountConnected ? 'Use listening activity to improve suggestions.' : 'Use this installation’s playback history to rank relevant ministry content.',
      value: personalization,
      onToggle: (value: boolean) => {
        setPersonalization(value);
        persistPreference('personalizationEnabled', value)
          .then(() => {
            void queryClient.invalidateQueries({ queryKey: ['feed'] });
            showModal({ title: 'Recommendations updated', message: value ? 'Installation-based recommendations are on.' : 'Recommendation tracking is off.', tone: 'info', icon: 'auto-awesome' });
          })
          .catch(() => {
            setPersonalization(!value);
            showModal({ title: 'Update failed', message: 'Could not save this setting. Please try again.', tone: 'error', icon: 'auto-awesome' });
          });
      },
    },
    {
      kind: 'toggle',
      icon: 'bug-report',
      label: 'Crash diagnostics',
      hint: 'Controls whether unexpected errors are sent to the configured diagnostics service.',
      value: diagnostics,
      onToggle: makeToggleHandler('diagnosticsEnabled', setDiagnostics, { title: 'Diagnostics updated', on: 'Crash reports are shared.', off: 'Crash reports are off.', icon: 'bug-report' }),
    },
  ], [accountConnected, diagnostics, handleNotificationsChange, makeToggleHandler, notifications, persistPreference, personalization, pushLoading, pushPermissionGranted, queryClient, showModal]);

  const isWideLayout = device.isDesktop || device.isTV;
  const quickItems = settingsHubSections.flatMap((section) => section.items);
  const quickColumns = isWideLayout ? Math.min(3, Math.max(2, quickItems.length)) : 1;
  const quickCellWidth = `${100 / quickColumns}%` as `${number}%`;
  const quickTones = [
    { color: theme.colors.primary, surface: theme.colors.primarySurface, border: theme.colors.primaryBorder },
    { color: theme.colors.success, surface: theme.colors.successSurface, border: theme.colors.successBorder },
    { color: theme.colors.info, surface: theme.colors.infoSurface, border: theme.colors.infoBorder },
    { color: theme.colors.danger, surface: theme.colors.dangerSurface, border: theme.colors.dangerBorder },
  ] as const;

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
      <View style={[styles.sectionShell, styles.introCard]}>
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={styles.introLogo} />
          </View>
          <View style={styles.introCopy}>
            <CustomText style={styles.introTitle}>Your experience</CustomText>
            <CustomText style={styles.introSubtitle}>Manage how the app looks, plays, notifies you, and handles your privacy.</CustomText>
          </View>
        </View>
      </View>

      <AppearanceCard value={themePreference} onChange={handleAppearanceChange} />

      <View style={[styles.settingsGroupsRow, { flexDirection: isWideLayout ? 'row' : 'column', alignItems: isWideLayout ? 'flex-start' : 'stretch' }]}> 
        <View style={[styles.sectionShell, styles.settingsGroupCard]}>
          <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
            <View style={styles.sectionHeaderIcon}><AppIcon name="play-circle-outline" size={19} color={theme.colors.primary} /></View>
            <View style={styles.sectionHeaderCopy}>
              <CustomText style={styles.sectionTitle}>Playback</CustomText>
              <CustomText style={styles.sectionSubtitle}>Listening quality and queue behavior</CustomText>
            </View>
          </View>
          <View style={styles.sectionBody}>
            {playbackSettings.map((item) => (
              <View key={item.label} style={[styles.rowDivider, { borderTopWidth: 1 }]}><SettingRow item={item} /></View>
            ))}
          </View>
        </View>

        <View style={[styles.sectionShell, styles.settingsGroupCard]}>
          <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
            <View style={styles.sectionHeaderIcon}><AppIcon name="security" size={19} color={theme.colors.primary} /></View>
            <View style={styles.sectionHeaderCopy}>
              <CustomText style={styles.sectionTitle}>Experience & privacy</CustomText>
              <CustomText style={styles.sectionSubtitle}>Alerts, personalization, and diagnostics</CustomText>
            </View>
          </View>
          <View style={styles.sectionBody}>
            {experienceSettings.map((item) => (
              <View key={item.label} style={[styles.rowDivider, { borderTopWidth: 1 }]}><SettingRow item={item} /></View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.sectionShell}>
        <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
          <View style={styles.sectionHeaderIcon}><AppIcon name="grid" size={19} color={theme.colors.primary} /></View>
          <View style={styles.sectionHeaderCopy}>
            <CustomText style={styles.sectionTitle}>Services & information</CustomText>
            <CustomText style={styles.sectionSubtitle}>Library, support, giving, legal, and product destinations</CustomText>
          </View>
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
                color={quickTones[idx % quickTones.length]!.color}
                surface={quickTones[idx % quickTones.length]!.surface}
                border={quickTones[idx % quickTones.length]!.border}
                onPress={() => router.push((APP_ROUTE_BY_ID[item.destination as AppRouteId] ?? APP_ROUTES.tabs.settings) as never)}
              />
            </View>
          ))}
        </View>
      </View>
    </PremiumPage>
  );
}

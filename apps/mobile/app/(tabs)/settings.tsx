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
import { BrandWordmark } from '../../components/branding';
import { getStoredMobileSession } from '../../services/authService';
import { fetchInstallationPreferences, fetchMePreferences, updateInstallationNotifications, updateInstallationPersonalization, updateMePreferences, type MePreferences } from '../../services/userFlowService';
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
// Grouped into clean, professional categories (Data & Privacy, Ministry, About & Legal).
const DEFAULT_QUICK_ACCESS_SECTIONS: {
  id: string;
  title: string;
  items: { id: string; icon: string; label: string; hint: string; destination: AppRouteId }[];
}[] = [
  {
    id: 'privacy-data',
    title: 'Data & Privacy',
    items: [
      { id: 'privacy-controls', icon: 'security', label: 'Data & Privacy Controls', hint: 'Manage data, exports, recommendations & deletion', destination: 'settings.privacy' },
    ],
  },
  {
    id: 'support',
    title: 'Ministry & Support',
    items: [
      { id: 'donate', icon: 'volunteer-activism', label: 'Support & Giving', hint: 'Partner with ClaudyGod Ministries', destination: 'settings.donate' },
      { id: 'help', icon: 'help-outline', label: 'Help & Support', hint: 'FAQs, contact, and prayer support', destination: 'settings.help' },
      { id: 'referral', icon: 'card-giftcard', label: 'Invite friends', hint: 'Share worship with friends & family', destination: 'settings.referral' },
    ],
  },
  {
    id: 'product-legal',
    title: 'About & Legal',
    items: [
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
  settingRowTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 52,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.subtleFillMed,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingIconActive: {
    backgroundColor: theme.colors.primarySurface,
    borderColor: theme.colors.primaryBorder,
  },
  settingTextWrap: { flex: 1, minWidth: 0 },
  settingLabel: {
    color: theme.colors.text,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  settingHint: {
    color: theme.colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  settingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  settingStatusText: {
    color: theme.colors.primary,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  sectionShell: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.elevated,
    ...theme.shadows.sm,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  sectionHeaderCopy: { flex: 1, minWidth: 0 },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: theme.colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  sectionBody: {
    paddingHorizontal: 0,
  },

  appearanceRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  appearanceOption: {
    flex: 1,
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.subtleFill,
  },
  appearanceOptionActive: {
    backgroundColor: theme.colors.primarySurface,
    borderColor: theme.colors.primaryBorder,
  },
  appearanceLabel: {
    color: theme.colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    fontWeight: '600',
  },
  appearanceLabelActive: {
    color: theme.colors.text,
  },
  appearanceHint: {
    color: theme.colors.textMuted,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 9.5,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  appearanceIndicator: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 4,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  linkIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  linkLabelWrap: { flex: 1, minWidth: 0 },
  linkLabel: {
    color: theme.colors.text,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  linkHint: {
    color: theme.colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },

  introCard: { padding: theme.spacing.lg, gap: theme.spacing.lg, borderColor: theme.colors.primaryBorder, ...theme.shadows.md },
  intro: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  introIcon: { width: 58, height: 58, borderRadius: theme.radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  introLogo: { width: 42, height: 42, borderRadius: theme.radius.lg },
  introCopy: { flex: 1, minWidth: 0 },
  introTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 19, marginTop: theme.spacing.xxs },
  introSubtitle: { color: theme.colors.textSecondary, fontSize: 13, marginTop: theme.spacing.xs, lineHeight: 19 },
  accountCard: {
    padding: 16,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  accountMeta: { flex: 1, minWidth: 0 },
  accountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    marginBottom: 4,
  },
  accountBadgeText: {
    color: theme.colors.primary,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountTitle: {
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  accountSubtitle: {
    color: theme.colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: theme.colors.border },
  quickCell: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rowDivider: {
    borderTopColor: theme.colors.divider,
  },
  settingsGroupsRow: { gap: 14 },
  homeBtn: { minWidth: 40, paddingHorizontal: 10 },
  settingsGroupCard: { flex: 1 },
  versionFooter: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: 8,
  },
  versionLabel: {
    color: theme.colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
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
      style={styles.settingRowTouch}
      showFocusBorder={false}
      accessibilityRole={isToggle ? 'switch' : 'text'}
      accessibilityState={isToggle ? { checked: item.value } : undefined}
    >
      <View style={[styles.settingIcon, isEnabled ? styles.settingIconActive : null]}>
        <AppIcon
          name={item.icon}
          size={device.isTV ? 19 : 17}
          color={isToggle ? (item.value ? accentColor : theme.colors.textSecondary) : theme.colors.primary}
        />
      </View>
      <View style={styles.settingTextWrap}>
        <CustomText variant="body" style={styles.settingLabel}>
          {item.label}
        </CustomText>
        {item.hint ? (
          <CustomText variant="caption" style={styles.settingHint}>
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
        <View style={styles.settingStatus}>
          <CustomText style={styles.settingStatusText}>{item.statusLabel}</CustomText>
        </View>
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
    { value: 'system', label: 'System', icon: 'devices', hint: 'Automatic' },
    { value: 'light', label: 'Light', icon: 'sun', hint: 'Light mode' },
    { value: 'dark', label: 'Dark', icon: 'moon', hint: 'Dark mode' },
  ];

  return (
    <View style={styles.sectionShell}>
      <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
        <View style={styles.sectionHeaderIcon}>
          <AppIcon name="palette" size={17} color={theme.colors.primary} />
        </View>
        <View style={styles.sectionHeaderCopy}>
          <CustomText variant="title" style={styles.sectionTitle}>Appearance</CustomText>
          <CustomText variant="caption" style={styles.sectionSubtitle}>Choose how ClaudyGod looks on this device</CustomText>
        </View>
      </View>
      <View style={styles.appearanceRow}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <TVTouchable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.appearanceOption, active ? styles.appearanceOptionActive : null]}
              showFocusBorder={false}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <AppIcon name={option.icon} size={device.isTV ? 20 : 18} color={active ? theme.colors.primary : theme.colors.textSecondary} />
              <CustomText
                style={[
                  styles.appearanceLabel,
                  active ? styles.appearanceLabelActive : null,
                ]}
              >
                {option.label}
              </CustomText>
              <CustomText style={styles.appearanceHint}>
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
      <View style={styles.linkRow}> 
        <View style={[styles.linkIcon, { backgroundColor: surface, borderColor: border }]}>
          <AppIcon name={icon} size={device.isTV ? 19 : 17} color={color} />
        </View>
        <View style={styles.linkLabelWrap}>
          <CustomText variant="body" style={styles.linkLabel}>
            {label}
          </CustomText>
          {hint ? (
            <CustomText variant="caption" style={styles.linkHint}>
              {hint}
            </CustomText>
          ) : null}
        </View>
        <AppIcon name="chevron-right" size={18} color={theme.colors.textMuted} />
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
    const rawSections = configured.length ? configured : DEFAULT_QUICK_ACCESS_SECTIONS;

    // Collect and flatten all valid items
    const allItems: { id: string; icon: string; label: string; hint: string; destination: AppRouteId }[] = [];
    const seenDestinations = new Set<string>();

    for (const section of rawSections) {
      for (const item of section.items) {
        // Exclude library, tabs, or profile duplicates
        if (
          item.destination === 'tabs.library' ||
          item.id === 'library' ||
          item.id === 'profile' ||
          seenDestinations.has(item.destination)
        ) {
          continue;
        }
        seenDestinations.add(item.destination);
        allItems.push(item);
      }
    }

    // High-end Spotify & Apple Music grouping:
    // 1. Privacy & Legal (Privacy controls, Privacy policy, Terms of service)
    const privacyItems = allItems.filter(
      (item) =>
        item.destination.toLowerCase().includes('privacy') ||
        item.destination.toLowerCase().includes('term') ||
        item.id.toLowerCase().includes('privacy') ||
        item.id.toLowerCase().includes('term'),
    );

    // 2. Ministry & Giving (Donate, referral/share)
    const ministryItems = allItems.filter(
      (item) =>
        item.destination.toLowerCase().includes('donate') ||
        item.destination.toLowerCase().includes('referral') ||
        item.id.toLowerCase().includes('donate') ||
        item.id.toLowerCase().includes('referral') ||
        item.id.toLowerCase().includes('give'),
    );

    // 3. Help & About (Help center, About, Rate)
    const helpAboutItems = allItems.filter(
      (item) =>
        !privacyItems.includes(item) &&
        !ministryItems.includes(item),
    );

    const canonicalSections: {
      id: string;
      title: string;
      subtitle: string;
      icon: AppIconName;
      items: typeof allItems;
    }[] = [];

    if (privacyItems.length > 0) {
      canonicalSections.push({
        id: 'privacy-legal',
        title: 'Privacy & Legal',
        subtitle: 'Data controls, permissions, and official policies',
        icon: 'security',
        items: privacyItems,
      });
    }

    if (ministryItems.length > 0) {
      canonicalSections.push({
        id: 'ministry-support',
        title: 'Ministry & Support',
        subtitle: 'Partner with us, give, and share worship with friends',
        icon: 'volunteer-activism',
        items: ministryItems,
      });
    }

    if (helpAboutItems.length > 0) {
      canonicalSections.push({
        id: 'help-about',
        title: 'Help & About',
        subtitle: 'FAQs, contact support, feedback, and ministry info',
        icon: 'info-outline',
        items: helpAboutItems,
      });
    }

    return canonicalSections;
  }, [appConfig]);

  const [notifications,   setNotifications]   = useState(true);
  const [autoPlay,        setAutoPlay]         = useState(true);
  const [personalization, setPersonalization]  = useState(true);
  const [diagnostics,      setDiagnostics]     = useState(true);
  const [accountConnected, setAccountConnected] = useState(false);
  const [userEmail,        setUserEmail]        = useState<string | null>(null);

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
      if (!cancelled) {
        setAccountConnected(Boolean(user));
        setUserEmail(user?.email ?? null);
      }
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

  return (
    <PremiumPage
      title="Settings"
      eyebrow="Preferences"
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
      {/* ─── Profile / Account Card ─── */}
      <View style={styles.accountCard}>
        <TVTouchable
          onPress={() => router.push(accountConnected ? APP_ROUTES.accountSecurity : APP_ROUTES.auth.signIn)}
          showFocusBorder={false}
          accessibilityRole="button"
        >
          <View style={styles.accountRow}>
            <View style={styles.accountAvatar}>
              <AppIcon
                name={accountConnected ? 'person' : 'person-outline'}
                size={22}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.accountMeta}>
              <View style={styles.accountBadge}>
                <CustomText style={styles.accountBadgeText}>
                  {accountConnected ? 'Connected Account' : 'Guest Mode'}
                </CustomText>
              </View>
              <CustomText variant="title" style={styles.accountTitle} numberOfLines={1}>
                {accountConnected ? (userEmail ?? 'ClaudyGod Member') : 'Listening Locally'}
              </CustomText>
              <CustomText variant="caption" style={styles.accountSubtitle} numberOfLines={1}>
                {accountConnected ? 'Manage profile, security & sessions' : 'Sign in to sync favorites across devices'}
              </CustomText>
            </View>
            <AppIcon name="chevron-right" size={20} color={theme.colors.textMuted} />
          </View>
        </TVTouchable>
      </View>

      {/* ─── Appearance ─── */}
      <AppearanceCard value={themePreference} onChange={handleAppearanceChange} />

      {/* ─── Playback & Experience Toggles ─── */}
      <View style={[styles.settingsGroupsRow, { flexDirection: isWideLayout ? 'row' : 'column', alignItems: isWideLayout ? 'flex-start' : 'stretch' }]}> 
        <View style={[styles.sectionShell, styles.settingsGroupCard]}>
          <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
            <View style={styles.sectionHeaderIcon}><AppIcon name="play-circle-outline" size={17} color={theme.colors.primary} /></View>
            <View style={styles.sectionHeaderCopy}>
              <CustomText variant="title" style={styles.sectionTitle}>Playback</CustomText>
              <CustomText variant="caption" style={styles.sectionSubtitle}>Listening quality and queue behavior</CustomText>
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
            <View style={styles.sectionHeaderIcon}><AppIcon name="security" size={17} color={theme.colors.primary} /></View>
            <View style={styles.sectionHeaderCopy}>
              <CustomText variant="title" style={styles.sectionTitle}>Experience & privacy</CustomText>
              <CustomText variant="caption" style={styles.sectionSubtitle}>Alerts, personalization, and diagnostics</CustomText>
            </View>
          </View>
          <View style={styles.sectionBody}>
            {experienceSettings.map((item) => (
              <View key={item.label} style={[styles.rowDivider, { borderTopWidth: 1 }]}><SettingRow item={item} /></View>
            ))}
          </View>
        </View>
      </View>

      {/* ─── Grouped Service Sections ─── */}
      {settingsHubSections.map((section) => {
        const title = section.title;
        const subtitle = section.subtitle;
        const icon: AppIconName = section.icon;

        return (
          <View key={section.id} style={styles.sectionShell}>
            <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
              <View style={styles.sectionHeaderIcon}>
                <AppIcon name={icon} size={17} color={theme.colors.primary} />
              </View>
              <View style={styles.sectionHeaderCopy}>
                <CustomText variant="title" style={styles.sectionTitle}>{title}</CustomText>
                <CustomText variant="caption" style={styles.sectionSubtitle}>{subtitle}</CustomText>
              </View>
            </View>
            <View style={styles.sectionBody}>
              {section.items.map((item, idx) => (
                <View
                  key={item.id}
                  style={[styles.rowDivider, idx > 0 ? { borderTopWidth: 1 } : null]}
                >
                  <QuickLinkRow
                    icon={item.icon as AppIconName}
                    label={item.label}
                    hint={item.hint}
                    color={theme.colors.primary}
                    surface={theme.colors.primarySurface}
                    border={theme.colors.primaryBorder}
                    onPress={() => router.push((APP_ROUTE_BY_ID[item.destination as AppRouteId] ?? APP_ROUTES.tabs.settings) as never)}
                  />
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* ─── App Version Footer ─── */}
      <View style={styles.versionFooter}>
        <BrandWordmark size="xs" showDot showSubtitle subtitleText="MUSIC & MINISTRIES" align="center" />
        <CustomText variant="caption" style={styles.versionLabel}>
          ClaudyGod v1.0.0 · Worship without limits
        </CustomText>
      </View>
    </PremiumPage>
  );
}

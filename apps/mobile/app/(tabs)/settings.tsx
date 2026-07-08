import React, { useCallback, useMemo, useState } from 'react';
import { Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppModal } from '../../context/AppModalContext';
import { useAppTheme, useThemeContext } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import { useUserAccount } from '../../context/UserAccountContext';
import { useAccountSheet } from '../../context/AccountSheetContext';
import {
  PremiumPage,
  SectionLabel,
} from '../../components/feed';

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemePreference = 'system' | 'light' | 'dark';

type SettingItem = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  hint?: string;
  value: boolean;
  accent?: string;
  onToggle: (_value: boolean) => void;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // SettingRow
  settingRowTouch:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  settingTextWrap:  { flex: 1 },
  settingLabel:     { color: theme.colors.text, fontWeight: '600' },
  settingHint:      { color: theme.colors.textSecondary, marginTop: 3, lineHeight: 16 },

  // AppearanceCard
  appearancePad:    { padding: theme.spacing.lg },
  appearanceRow:    { flexDirection: 'row', gap: 10, marginTop: 16 },

  // QuickLinkRow
  linkRow:          { flexDirection: 'row', alignItems: 'center', gap: 14 },
  linkLabelWrap:    { flex: 1, minWidth: 0 },
  linkLabel:        { color: theme.colors.text, fontWeight: '600' },
  linkHint:         { color: theme.colors.textSecondary, marginTop: 2 },

  // SettingsScreen
  identityCard:     { overflow: 'hidden' },
  identityWash:     { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  identityCircle1:  { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: `${theme.colors.primary}12` },
  identityCircle2:  { position: 'absolute', bottom: -40, left: -24, width: 100, height: 100, borderRadius: 50, backgroundColor: `${theme.colors.primary}0A` },
  identityWrap:     { flex: 1, minWidth: 0 },
  identityName:     { color: theme.colors.text, fontWeight: '700', letterSpacing: -0.3 },
  identitySub:      { color: theme.colors.textSecondary, marginTop: 3 },
  accountBtnWrap:   { marginTop: 14, gap: 8 },
  quickLinkSection: { gap: 12 },
  sectionGroupPad:  { paddingTop: 14, paddingBottom: 6 },
  sectionGroupLabel:{ color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.0, textTransform: 'uppercase' },
  rowDivider:       { borderTopColor: theme.colors.border },
  rowGroupWide:     { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  quickGroupTopWash:{ position: 'absolute', top: 0, left: 0, right: 0, height: 46 },
  settingsGroupsRow:{ gap: 12 },
  homeBtn:          { minWidth: 40, paddingHorizontal: 10 },
  cardEdgePad:      { paddingHorizontal: theme.spacing.md, paddingVertical: 0 },
  settingsGroupCard: { flex: 1, paddingHorizontal: theme.spacing.md, paddingVertical: 0 },
}));

// ─── SettingRow ───────────────────────────────────────────────────────────────

function SettingRow({ item }: { item: SettingItem }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const accentColor = item.accent ?? theme.colors.primary;
  const boxSize = device.isTV ? 50 : 46;
  const boxRadius = device.isTV ? 15 : 13;

  return (
    <TVTouchable
      onPress={() => item.onToggle(!item.value)}
      style={[styles.settingRowTouch, { paddingVertical: device.isTV ? 20 : 16 }]}
      showFocusBorder={false}
      accessibilityRole="switch"
      accessibilityState={{ checked: item.value }}
    >
      <View
        style={{
          width: boxSize, height: boxSize, borderRadius: boxRadius,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: item.value ? `${accentColor}18` : theme.colors.subtleFill,
          borderWidth: 1,
          borderColor: item.value ? `${accentColor}30` : theme.colors.border,
        }}
      >
        <MaterialIcons
          name={item.icon}
          size={device.isTV ? 24 : 21}
          color={item.value ? accentColor : theme.colors.textMuted}
        />
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
        thumbColor={theme.colors.textInverse}
        trackColor={{ false: theme.colors.border, true: `${accentColor}88` }}
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

  const options: { value: ThemePreference; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name']; hint: string }[] = [
    { value: 'system', label: 'System',  icon: 'devices',    hint: 'Match device setting' },
    { value: 'light',  label: 'Light',   icon: 'light-mode', hint: 'Always light' },
    { value: 'dark',   label: 'Dark',    icon: 'dark-mode',  hint: 'Always dark' },
  ];

  return (
    <SurfaceCard tone="strong" style={styles.appearancePad}>
      <SectionLabel title="Appearance" accent="Display" subtitle="Choose how the app looks on your screen" />
      <View style={styles.appearanceRow}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <TVTouchable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={{
                flex: 1, minHeight: device.isTV ? 92 : 78,
                borderRadius: theme.radius.xl, borderWidth: 1.5,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? theme.colors.card : theme.colors.subtleFill,
                alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10,
                ...(active ? theme.shadows.sm : null),
              }}
              showFocusBorder={false}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View
                style={{
                  width: device.isTV ? 44 : 36, height: device.isTV ? 44 : 36,
                  borderRadius: 11, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: active ? theme.colors.elevated : theme.colors.subtleFillMed,
                }}
              >
                <MaterialIcons
                  name={option.icon}
                  size={device.isTV ? 24 : 20}
                  color={active ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
              <CustomText
                style={{
                  color: active ? theme.colors.text : theme.colors.textSecondary,
                  fontSize: device.isTV ? 15 : 13,
                  fontWeight: active ? '700' : '600',
                }}
              >
                {option.label}
              </CustomText>
              <CustomText style={{ color: theme.colors.textMuted, fontSize: device.isTV ? 11.5 : 10.5, textAlign: 'center' }}>
                {option.hint}
              </CustomText>
            </TVTouchable>
          );
        })}
      </View>
    </SurfaceCard>
  );
}

// ─── QuickLinkRow ─────────────────────────────────────────────────────────────

function QuickLinkRow({ icon, label, hint, color, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; hint?: string; color: string; onPress: () => void }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const boxSize = device.isTV ? 50 : 46;
  const boxRadius = device.isTV ? 15 : 13;

  return (
    <TVTouchable onPress={onPress} showFocusBorder={false}>
      <View style={[styles.linkRow, { paddingVertical: device.isTV ? 18 : 16 }]}>
        <View
          style={{
            width: boxSize, height: boxSize, borderRadius: boxRadius,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}28`,
          }}
        >
          <MaterialIcons name={icon} size={device.isTV ? 24 : 21} color={color} />
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
        <MaterialIcons name="chevron-right" size={19} color={theme.colors.textMuted} />
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
  const { account, isSignedIn, signOut } = useUserAccount();
  const { openAccountSheet } = useAccountSheet();

  const [notifications,   setNotifications]   = useState(true);
  const [autoPlay,        setAutoPlay]         = useState(true);
  const [highQuality,     setHighQuality]      = useState(false);
  const [personalization, setPersonalization]  = useState(true);

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
  const accountPad   = device.isTV ? 20 : 16;
  const avatarSize   = device.isTV ? 76 : 60;
  const avatarRadius = device.isTV ? 22 : 18;
  const nameSize     = device.isTV ? 20 : 16;
  const subSize      = device.isTV ? 13 : 12;

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
          leftIcon={<MaterialIcons name="home-filled" size={16} color={theme.colors.text} />}
        />
      }
    >
      {/* Identity / Account card */}
      <SurfaceCard tone="strong" style={[styles.identityCard, { padding: accountPad }]}>
        <LinearGradient
          colors={[`${theme.colors.primary}14`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.identityWash}
        />
        <View style={styles.identityCircle1} />
        <View style={styles.identityCircle2} />

        <View style={{ flexDirection: isWideLayout ? 'row' : 'column', gap: isWideLayout ? 20 : 16, alignItems: isWideLayout ? 'center' : 'flex-start' }}>
          <View
            style={{
              width: avatarSize, height: avatarSize, borderRadius: avatarRadius,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: isSignedIn ? theme.colors.primarySurface : theme.colors.primarySurface,
              borderWidth: 2,
              borderColor: theme.colors.primaryBorder,
              ...theme.shadows.sm,
            }}
          >
            <MaterialIcons
              name={isSignedIn ? 'person' : 'headphones'}
              size={device.isTV ? 36 : 28}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.identityWrap}>
            <CustomText style={[styles.identityName, { fontSize: nameSize + 1 }]}>
              {isSignedIn ? account!.displayName : 'ClaudyGod Listener'}
            </CustomText>
            <CustomText style={[styles.identitySub, { fontSize: subSize }]}>
              {isSignedIn ? account!.email : 'Worship freely — no account required'}
            </CustomText>
          </View>
        </View>

        <View style={[styles.accountBtnWrap, { flexDirection: isWideLayout ? 'row' : 'column' }]}>
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
      <View style={styles.quickLinkSection}>
        <SectionLabel title="Quick access" accent="Navigate" />
        <View style={{ flexDirection: isWideLayout ? 'row' : 'column', gap: 12 }}>
          <View style={isWideLayout ? styles.rowGroupWide : {}}>
            <SurfaceCard tone="subtle" style={styles.cardEdgePad}>
              <LinearGradient
                colors={[`${theme.colors.primary}0F`, 'transparent']}
                style={styles.quickGroupTopWash}
              />
              {[
                { icon: 'library-music' as const, label: 'Library', hint: 'Saved content',             color: theme.colors.primary, onPress: () => router.push(APP_ROUTES.tabs.library) },
                { icon: 'search'        as const, label: 'Search',  hint: 'Find songs, videos, and live', color: theme.colors.success, onPress: () => router.push(APP_ROUTES.tabs.search) },
              ].map((link, idx) => (
                <View key={link.label} style={[styles.rowDivider, { borderTopWidth: idx === 0 ? 0 : 1 }]}>
                  <QuickLinkRow {...link} />
                </View>
              ))}
            </SurfaceCard>
          </View>
          <View style={isWideLayout ? styles.rowGroupWide : {}}>
            <SurfaceCard tone="subtle" style={styles.cardEdgePad}>
              <LinearGradient
                colors={[`${theme.colors.primary}0F`, 'transparent']}
                style={styles.quickGroupTopWash}
              />
              {[
                { icon: 'card-giftcard'      as const, label: 'Invite friends', hint: 'Earn rewards together', color: theme.colors.primary, onPress: () => router.push(APP_ROUTES.settingsPages.referral) },
                { icon: 'help-outline'       as const, label: 'Help',           hint: 'Get support',           color: theme.colors.info,    onPress: () => router.push(APP_ROUTES.settingsPages.help) },
                { icon: 'volunteer-activism' as const, label: 'Support',        hint: 'Give or donate',        color: theme.colors.danger,  onPress: () => router.push(APP_ROUTES.settingsPages.donate) },
              ].map((link, idx) => (
                <View key={link.label} style={[styles.rowDivider, { borderTopWidth: idx === 0 ? 0 : 1 }]}>
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
      <View style={[styles.settingsGroupsRow, { flexDirection: isWideLayout ? 'row' : 'column', alignItems: isWideLayout ? 'flex-start' : 'stretch' }]}>
        <SurfaceCard tone="subtle" style={styles.settingsGroupCard}>
          <View style={styles.sectionGroupPad}>
            <CustomText style={styles.sectionGroupLabel}>Playback</CustomText>
          </View>
          {playbackSettings.map((item, index) => (
            <View key={item.label} style={[styles.rowDivider, { borderTopWidth: index === 0 ? 0 : 1 }]}>
              <SettingRow item={item} />
            </View>
          ))}
        </SurfaceCard>

        <SurfaceCard tone="subtle" style={styles.settingsGroupCard}>
          <View style={styles.sectionGroupPad}>
            <CustomText style={styles.sectionGroupLabel}>Experience</CustomText>
          </View>
          {experienceSettings.map((item, index) => (
            <View key={item.label} style={[styles.rowDivider, { borderTopWidth: index === 0 ? 0 : 1 }]}>
              <SettingRow item={item} />
            </View>
          ))}
        </SurfaceCard>
      </View>
    </PremiumPage>
  );
}

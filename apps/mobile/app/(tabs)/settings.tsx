import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Switch, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AppButton } from '../../components/ui/AppButton';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { useToast } from '../../context/ToastContext';
import { useAppTheme, useThemeContext } from '../../util/colorScheme';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { fetchMePreferences, updateMePreferences } from '../../services/userFlowService';
import { clearMobileSession } from '../../services/authService';
import { APP_ROUTES, APP_ROUTE_BY_ID } from '../../util/appRoutes';
import { getSettingsHubSections } from '../../util/mobileExperienceConfig';
import { BRAND_HERO_ASSET } from '../../util/brandAssets';

type SettingItem = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  hint?: string;
  action?: () => void;
  type?: 'switch';
  value?: boolean;
  onToggle?: (_value: boolean) => void;
};

function SettingRow({ item }: { item: SettingItem }) {
  const theme = useAppTheme();
  const isSwitch = item.type === 'switch';
  const handlePress = () => {
    if (isSwitch) {
      item.onToggle?.(!Boolean(item.value));
      return;
    }

    item.action?.();
  };

  return (
    <TVTouchable
      onPress={handlePress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surfaceAlt,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <MaterialIcons name={item.icon} size={17} color={theme.colors.text} />
      </View>

      <View style={{ flex: 1 }}>
        <CustomText variant="body" style={{ color: theme.colors.text, fontWeight: '600' }}>
          {item.label}
        </CustomText>
        {item.hint ? (
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2, lineHeight: 14 }}>
            {item.hint}
          </CustomText>
        ) : null}
      </View>

      {isSwitch ? (
        <Switch
          value={Boolean(item.value)}
          onValueChange={(value) => item.onToggle?.(value)}
          thumbColor={theme.colors.textInverse}
          trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}88` }}
          ios_backgroundColor={theme.colors.border}
        />
      ) : (
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.textSecondary} />
      )}
    </TVTouchable>
  );
}

function AppearanceModePicker({
  value,
  onChange,
}: {
  value: 'system' | 'light' | 'dark';
  onChange: (_value: 'system' | 'light' | 'dark') => void;
}) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const stackOptions = width < 390;
  const options: { value: 'system' | 'light' | 'dark'; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
    { value: 'system', label: 'System', icon: 'devices' },
    { value: 'light', label: 'Light', icon: 'light-mode' },
    { value: 'dark', label: 'Dark', icon: 'dark-mode' },
  ];

  return (
      <View style={{ gap: 12 }}>
        <View>
          <CustomText
            variant="caption"
          style={{
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.9,
          }}
          >
            Appearance
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
            Light, dark, or device theme. Your choice stays synced to your account.
          </CustomText>
        </View>

      <View style={{ flexDirection: stackOptions ? 'column' : 'row', gap: 10 }}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <TVTouchable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={{
                flex: 1,
                minHeight: stackOptions ? 48 : 52,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? theme.colors.surfaceAlt : theme.colors.surface,
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
              showFocusBorder={false}
            >
              <MaterialIcons
                name={option.icon}
                size={18}
                color={active ? theme.colors.primary : theme.colors.textSecondary}
              />
              <CustomText
                variant="label"
                style={{ color: active ? theme.colors.text : theme.colors.textSecondary }}
              >
                {option.label}
              </CustomText>
            </TVTouchable>
          );
        })}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const { themePreference, setThemePreference } = useThemeContext();
  const router = useRouter();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [personalization, setPersonalization] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [isLogoutSheetVisible, setIsLogoutSheetVisible] = useState(false);
  const { config: mobileConfig } = useMobileAppConfig();
  const isCompact = width < 390;
  const actionButtonMinWidth = isCompact ? 118 : 136;

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      try {
        const response = await fetchMePreferences();
        if (!active) return;
        setNotifications(response.preferences.notificationsEnabled);
        setAutoPlay(response.preferences.autoplayEnabled);
        setHighQuality(response.preferences.highQualityEnabled);
        setPersonalization(response.preferences.personalizationEnabled);
      } catch {
      } finally {
        if (active) setPreferencesLoaded(true);
      }
    };

    void loadPreferences();
    return () => {
      active = false;
    };
  }, []);

  const persistPreferencePatch = useCallback(
    (patch: Partial<Parameters<typeof updateMePreferences>[0]>) => {
      if (!preferencesLoaded) return;
      void updateMePreferences(patch).catch(() => {});
    },
    [preferencesLoaded],
  );

  const controlSections = useMemo(
    () => [
      {
        title: 'Playback',
        items: [
          {
            icon: 'play-circle-outline',
            label: 'Auto-play',
            hint: 'Continue to the next message or song',
            type: 'switch',
            value: autoPlay,
            onToggle: (value: boolean) => {
              setAutoPlay(value);
              persistPreferencePatch({ autoplayEnabled: value });
              showToast({
                title: 'Playback updated',
                message: value ? 'Auto-play is on.' : 'Auto-play is off.',
                tone: 'info',
              });
            },
          },
          {
            icon: 'high-quality',
            label: 'High quality audio',
            hint: 'Use more data for richer playback',
            type: 'switch',
            value: highQuality,
            onToggle: (value: boolean) => {
              setHighQuality(value);
              persistPreferencePatch({ highQualityEnabled: value });
              showToast({
                title: 'Audio quality updated',
                message: value ? 'Higher quality audio is enabled.' : 'Standard quality audio is enabled.',
                tone: 'info',
              });
            },
          },
        ] as SettingItem[],
      },
      {
        title: 'Preferences',
        items: [
          {
            icon: 'notifications-none',
            label: 'Notifications',
            hint: 'Live alerts and new releases',
            type: 'switch',
            value: notifications,
            onToggle: (value: boolean) => {
              setNotifications(value);
              persistPreferencePatch({ notificationsEnabled: value });
              showToast({
                title: 'Notifications updated',
                message: value ? 'Live and release alerts are on.' : 'Alerts are off.',
                tone: 'info',
              });
            },
          },
          {
            icon: 'auto-awesome',
            label: 'Personalized recommendations',
            hint: 'Use listening activity to improve suggestions',
            type: 'switch',
            value: personalization,
            onToggle: (value: boolean) => {
              setPersonalization(value);
              persistPreferencePatch({ personalizationEnabled: value });
              showToast({
                title: 'Recommendations updated',
                message: value ? 'Personalized recommendations are on.' : 'Recommendations are less personalized now.',
                tone: 'info',
              });
            },
          },
        ] as SettingItem[],
      },
    ],
    [
      autoPlay,
      highQuality,
      notifications,
      personalization,
      persistPreferencePatch,
      showToast,
    ],
  );
  const navigationSections = useMemo(
    () =>
      getSettingsHubSections(mobileConfig).map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({
          icon: item.icon as React.ComponentProps<typeof MaterialIcons>['name'],
          label: item.label,
          hint: item.hint,
          action: () => router.push(APP_ROUTE_BY_ID[item.destination]),
        })),
      })),
    [mobileConfig, router],
  );

  return (
    <TabScreenWrapper
      backgroundImage={BRAND_HERO_ASSET}
      backgroundHeight={340}
      backgroundOverlayColors={
        theme.scheme === 'dark'
          ? ['rgba(8,7,14,0.12)', 'rgba(8,7,14,0.62)', theme.colors.background]
          : ['rgba(76,29,149,0.08)', 'rgba(249,247,254,0.48)', theme.colors.background]
      }
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge }}>
            <FadeIn>
              <BrandedHeaderCard
                title="Settings"
                subtitle="Account, playback, notifications, and support."
                actions={[
                  { icon: 'home', onPress: () => router.push(APP_ROUTES.tabs.home), accessibilityLabel: 'Home' },
                ]}
              />
            </FadeIn>

            <FadeIn delay={60}>
              <SurfaceCard tone="strong" style={{ padding: theme.spacing.md }}>
                <View style={{ gap: 6 }}>
                  <CustomText
                    variant="caption"
                    style={{
                      color: theme.colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: 0.9,
                    }}
                  >
                    Control center
                  </CustomText>
                  <CustomText variant="heading" style={{ color: theme.colors.text }}>
                    Playback, appearance, and support in one calmer layout.
                  </CustomText>
                  <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>
                    Adjust your daily preferences, then jump straight to profile, library, or help without scanning oversized cards.
                  </CustomText>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: theme.spacing.md }}>
                  <AppButton
                    title="Profile"
                    variant="secondary"
                    size="sm"
                    onPress={() => router.push(APP_ROUTES.profile)}
                    leftIcon={<MaterialIcons name="person-outline" size={16} color={theme.colors.text} />}
                    style={{ flexGrow: 1, minWidth: actionButtonMinWidth }}
                  />
                  <AppButton
                    title="Library"
                    variant="outline"
                    size="sm"
                    onPress={() => router.push(APP_ROUTES.tabs.library)}
                    leftIcon={<MaterialIcons name="library-music" size={16} color={theme.colors.text} />}
                    style={{ flexGrow: 1, minWidth: actionButtonMinWidth }}
                  />
                  <AppButton
                    title="Help"
                    variant="outline"
                    size="sm"
                    onPress={() => router.push(APP_ROUTES.settingsPages.help)}
                    leftIcon={<MaterialIcons name="help-outline" size={16} color={theme.colors.text} />}
                    style={{ flexGrow: 1, minWidth: actionButtonMinWidth }}
                  />
                  <AppButton
                    title="Sign out"
                    variant="ghost"
                    size="sm"
                    onPress={() => setIsLogoutSheetVisible(true)}
                    leftIcon={<MaterialIcons name="logout" size={16} color={theme.colors.text} />}
                    style={{ flexGrow: 1, minWidth: actionButtonMinWidth }}
                  />
                </View>
              </SurfaceCard>
            </FadeIn>

            <FadeIn delay={85}>
              <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
                <AppearanceModePicker
                  value={themePreference}
                  onChange={(nextTheme) => {
                    setThemePreference(nextTheme);
                    persistPreferencePatch({ themePreference: nextTheme });
                    showToast({
                      title: 'Appearance updated',
                      message:
                        nextTheme === 'system'
                          ? 'ClaudyGod now follows your device appearance.'
                          : nextTheme === 'dark'
                            ? 'Dark mode is active.'
                            : 'Light mode is active.',
                      tone: 'info',
                    });
                  }}
                />
              </SurfaceCard>
            </FadeIn>

            {[...navigationSections, ...controlSections].map((section, sectionIndex) => (
              <FadeIn key={section.title} delay={120 + sectionIndex * 35}>
                <SurfaceCard tone="subtle" style={{ paddingHorizontal: theme.spacing.md, paddingVertical: 4 }}>
                  <View style={{ paddingTop: 10, paddingBottom: 2 }}>
                    <CustomText
                      variant="caption"
                      style={{
                        color: theme.colors.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: 0.9,
                      }}
                    >
                      {section.title}
                    </CustomText>
                  </View>

                  {section.items.map((item, itemIndex) => (
                    <View
                      key={`${section.title}-${item.label}`}
                      style={{
                        borderTopWidth: itemIndex === 0 ? 0 : 1,
                        borderTopColor: theme.colors.border,
                      }}
                    >
                      <SettingRow item={item} />
                    </View>
                  ))}
                </SurfaceCard>
              </FadeIn>
            ))}
          </View>
        </Screen>
      </ScrollView>
      <ActionSheet
        visible={isLogoutSheetVisible}
        title="Sign out of ClaudyGod?"
        description="You will need to sign in again to restore your library and preferences."
        actions={[
          {
            key: 'sign-out',
            label: 'Sign Out',
            detail: 'End your current session on this device.',
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
    </TabScreenWrapper>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useAppTheme, useColorSchemeToggle } from '../../util/colorScheme';
import { fetchMePreferences, updateMePreferences } from '../../services/userFlowService';
import { APP_ROUTES } from '../../util/appRoutes';

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

  return (
    <TVTouchable
      onPress={isSwitch ? undefined : item.action}
      disabled={isSwitch}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surfaceAlt,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <MaterialIcons name={item.icon} size={18} color={theme.colors.text.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <CustomText variant="title" style={{ color: theme.colors.text.primary }}>
          {item.label}
        </CustomText>
        {item.hint ? (
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
            {item.hint}
          </CustomText>
        ) : null}
      </View>

      {isSwitch ? (
        <Switch
          value={Boolean(item.value)}
          onValueChange={(value) => item.onToggle?.(value)}
          thumbColor={theme.colors.text.inverse}
          trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}88` }}
          ios_backgroundColor={theme.colors.border}
        />
      ) : (
        <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
      )}
    </TVTouchable>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const toggleColorScheme = useColorSchemeToggle();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      try {
        const response = await fetchMePreferences();
        if (!active) return;
        setNotifications(response.preferences.notificationsEnabled);
        setAutoPlay(response.preferences.autoplayEnabled);
        setHighQuality(response.preferences.highQualityEnabled);
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

  const sections = useMemo(
    () => [
      {
        title: 'Account',
        items: [
          {
            icon: 'person-outline',
            label: 'Profile',
            hint: 'Name, email, and account details',
            action: () => router.push(APP_ROUTES.profile),
          },
          {
            icon: 'shield',
            label: 'Privacy',
            hint: 'Permissions and account controls',
            action: () => router.push(APP_ROUTES.settingsPages.privacy),
          },
          {
            icon: 'volunteer-activism',
            label: 'Donate',
            hint: 'Support the ministry',
            action: () => router.push(APP_ROUTES.settingsPages.donate),
          },
        ] as SettingItem[],
      },
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
            },
          },
          {
            icon: 'dark-mode',
            label: 'Dark mode',
            hint: 'Keep the app in the darker player theme',
            type: 'switch',
            value: theme.scheme === 'dark',
            onToggle: () => {
              const nextTheme = theme.scheme === 'dark' ? 'light' : 'dark';
              toggleColorScheme();
              persistPreferencePatch({ themePreference: nextTheme });
            },
          },
        ] as SettingItem[],
      },
      {
        title: 'Support',
        items: [
          {
            icon: 'help-outline',
            label: 'Help',
            hint: 'FAQs and contact options',
            action: () => router.push(APP_ROUTES.settingsPages.help),
          },
          {
            icon: 'info-outline',
            label: 'About',
            hint: 'ClaudyGod and the ministry mission',
            action: () => router.push(APP_ROUTES.settingsPages.about),
          },
          {
            icon: 'rate-review',
            label: 'Rate app',
            hint: 'Share feedback about the experience',
            action: () => router.push(APP_ROUTES.settingsPages.rate),
          },
        ] as SettingItem[],
      },
    ],
    [
      autoPlay,
      highQuality,
      notifications,
      persistPreferencePatch,
      router,
      theme.scheme,
      toggleColorScheme,
    ],
  );

  return (
    <TabScreenWrapper>
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
              <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
                <View style={{ gap: 8 }}>
                  <CustomText
                    variant="caption"
                    style={{
                      color: theme.colors.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: 0.9,
                    }}
                  >
                    ClaudyGod account
                  </CustomText>
                  <CustomText variant="hero" style={{ color: theme.colors.text.primary }}>
                    Keep the experience simple and personal.
                  </CustomText>
                  <CustomText variant="body" style={{ color: theme.colors.text.secondary }}>
                    Manage playback, alerts, privacy, and support from one clean settings flow.
                  </CustomText>
                </View>
              </SurfaceCard>
            </FadeIn>

            {sections.map((section, sectionIndex) => (
              <FadeIn key={section.title} delay={100 + sectionIndex * 35}>
                <SurfaceCard tone="subtle" style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: 6 }}>
                  <View style={{ paddingTop: 12, paddingBottom: 4 }}>
                    <CustomText
                      variant="caption"
                      style={{
                        color: theme.colors.text.secondary,
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
    </TabScreenWrapper>
  );
}

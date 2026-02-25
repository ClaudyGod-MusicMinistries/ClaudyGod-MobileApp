import React, { useMemo, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme, useColorSchemeToggle } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';

type SettingItem = {
  icon: string;
  label: string;
  hint?: string;
  action?: () => void;
  type?: 'switch';
  value?: boolean;
  onToggle?: (_value: boolean) => void;
};

export default function Settings() {
  const theme = useAppTheme();
  const toggleColorScheme = useColorSchemeToggle();
  const router = useRouter();
  const isDark = theme.scheme === 'dark';
  const switchUi = {
    trackOn: isDark ? 'rgba(154,107,255,0.34)' : 'rgba(109,40,217,0.26)',
    trackOff: isDark ? 'rgba(255,255,255,0.12)' : theme.colors.border,
    thumbOn: theme.colors.primary,
    thumbOff: isDark ? '#D7CFF0' : '#FFFFFF',
    iosBackground: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
  } as const;

  const ui = {
    stickyBg: isDark ? '#06040D' : '#F4F1FA',
    stickyBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
    stickyGlow: isDark ? 'rgba(154,107,255,0.06)' : 'rgba(109,40,217,0.08)',
    headerCardBg: isDark ? 'rgba(10,8,17,0.88)' : 'rgba(255,255,255,0.95)',
    headerCardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.08)',
    headerMuted: isDark ? 'rgba(194,185,220,0.9)' : 'rgba(94,86,120,0.92)',
    headerSubtle: isDark ? 'rgba(176,167,202,0.9)' : 'rgba(108,99,134,0.9)',
    iconButtonBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(109,40,217,0.05)',
    iconButtonBorder: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(20,16,33,0.08)',
    iconButtonText: isDark ? '#EFE7FF' : '#3F2A76',
    overviewBg: isDark ? 'rgba(12,9,20,0.88)' : '#FFFFFF',
    overviewBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    softPanel: isDark ? 'rgba(255,255,255,0.03)' : '#F8F5FD',
    softBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.06)',
    chipBg: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
    chipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(20,16,33,0.08)',
    chipText: isDark ? '#CEC4E7' : '#5C5478',
  } as const;

  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);

  const sections = useMemo(
    () => [
      {
        title: 'Account',
        description: 'Profile, privacy and subscriptions',
        items: [
          { icon: 'person', label: 'Profile', hint: 'Name, email and personal details', action: () => router.push('/profile') },
          { icon: 'security', label: 'Privacy & Security', hint: 'Data controls and permissions', action: () => router.push('/settingsPage/Privacy') },
          { icon: 'volunteer-activism', label: 'Donate', hint: 'Contribution plans and checkout', action: () => router.push('/settingsPage/Donate') },
        ] as SettingItem[],
      },
      {
        title: 'Playback',
        description: 'Auto-play and streaming quality',
        items: [
          { icon: 'play-arrow', label: 'Auto-play', hint: 'Continue to related media', type: 'switch', value: autoPlay, onToggle: setAutoPlay },
          { icon: 'hd', label: 'High quality', hint: 'Use more data for better sound', type: 'switch', value: highQuality, onToggle: setHighQuality },
        ] as SettingItem[],
      },
      {
        title: 'Preferences',
        description: 'Notifications and interface behavior',
        items: [
          { icon: 'notifications', label: 'Notifications', hint: 'Reminders for lives and releases', type: 'switch', value: notifications, onToggle: setNotifications },
          {
            icon: 'dark-mode',
            label: 'Dark mode',
            hint: 'Keep premium dark interface enabled',
            type: 'switch',
            value: theme.scheme === 'dark',
            onToggle: () => toggleColorScheme(),
          },
        ] as SettingItem[],
      },
      {
        title: 'Support',
        description: 'Help, about and feedback',
        items: [
          { icon: 'help', label: 'Help & Support', hint: 'FAQs and contact channels', action: () => router.push('/settingsPage/help') },
          { icon: 'info', label: 'About', hint: 'Product mission and team', action: () => router.push('/settingsPage/About') },
          { icon: 'rate-review', label: 'Rate App', hint: 'Share product feedback', action: () => router.push('/settingsPage/Rate') },
        ] as SettingItem[],
      },
    ],
    [autoPlay, highQuality, notifications, router, theme.scheme, toggleColorScheme],
  );

  const quickLabels = ['Account', 'Playback', 'Preferences', 'Support'];

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        bounces={false}
        overScrollMode="never"
        stickyHeaderIndices={[0]}
      >
        <View
          style={{
            backgroundColor: ui.stickyBg,
            borderBottomWidth: 1,
            borderBottomColor: ui.stickyBorder,
          }}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[ui.stickyGlow, 'rgba(0,0,0,0)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <Screen>
            <FadeIn>
              <View style={{ paddingTop: theme.spacing.lg, paddingBottom: 10 }}>
                <SettingsHeader
                  onOpenHome={() => router.push('/(tabs)/home')}
                  quickLabels={quickLabels}
                  onOpenMenu={() => router.push('/(tabs)/videos')}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: 14 }}>
            <FadeIn delay={70}>
              <View
                style={{
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: ui.overviewBorder,
                  backgroundColor: ui.overviewBg,
                  padding: theme.spacing.lg,
                }}
              >
                <CustomText variant="caption" style={{ color: ui.headerMuted }}>
                  Quick Settings
                </CustomText>
                <CustomText variant="caption" style={{ color: ui.headerSubtle, marginTop: 4 }}>
                  Manage account, playback and notifications in one place.
                </CustomText>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: ui.softBorder,
                      backgroundColor: ui.softPanel,
                      padding: 10,
                    }}
                  >
                    <CustomText variant="caption" style={{ color: ui.headerSubtle }}>
                      Theme
                    </CustomText>
                    <CustomText variant="label" style={{ color: theme.colors.text.primary, marginTop: 4 }}>
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </CustomText>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: ui.softBorder,
                      backgroundColor: ui.softPanel,
                      padding: 10,
                    }}
                  >
                    <CustomText variant="caption" style={{ color: ui.headerSubtle }}>
                      Notifications
                    </CustomText>
                    <CustomText variant="label" style={{ color: theme.colors.text.primary, marginTop: 4 }}>
                      {notifications ? 'Enabled' : 'Off'}
                    </CustomText>
                  </View>
                </View>
              </View>
            </FadeIn>

            {sections.map((section, sectionIndex) => (
              <FadeIn key={section.title} delay={110 + sectionIndex * 60}>
                <View style={{ marginTop: theme.spacing.lg }}>
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                    {section.title}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                    {section.description}
                  </CustomText>
                  <SurfaceCard style={{ marginTop: theme.spacing.sm, paddingVertical: 2 }}>
                    {section.items.map((item, index) => (
                      <TVTouchable
                        key={item.label}
                        onPress={item.action}
                        disabled={item.type === 'switch'}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: theme.spacing.md,
                          borderBottomWidth: index === section.items.length - 1 ? 0 : 1,
                          borderBottomColor: theme.colors.border,
                          backgroundColor: 'transparent',
                        }}
                        showFocusBorder={false}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${theme.colors.primary}16`,
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.06)',
                            marginRight: theme.spacing.md,
                          }}
                        >
                          <MaterialIcons name={item.icon as any} size={18} color={theme.colors.primary} />
                        </View>

                        <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
                          <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                            {item.label}
                          </CustomText>
                          {item.hint ? (
                            <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 3 }}>
                              {item.hint}
                            </CustomText>
                          ) : null}
                        </View>

                        {item.type === 'switch' ? (
                          <Switch
                            value={Boolean(item.value)}
                            onValueChange={item.onToggle}
                            trackColor={{ true: switchUi.trackOn, false: switchUi.trackOff }}
                            thumbColor={item.value ? switchUi.thumbOn : switchUi.thumbOff}
                            ios_backgroundColor={switchUi.iosBackground}
                          />
                        ) : (
                          <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.secondary} />
                        )}
                      </TVTouchable>
                    ))}
                  </SurfaceCard>
                </View>
              </FadeIn>
            ))}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function SettingsHeader({
  onOpenHome,
  quickLabels,
  onOpenMenu,
}: {
  onOpenHome: () => void;
  quickLabels: string[];
  onOpenMenu: () => void;
}) {
  return (
    <BrandedHeaderCard
      title="Settings"
      actions={[
        { icon: 'home', onPress: onOpenHome, accessibilityLabel: 'Open home' },
        { icon: 'more-vert', onPress: onOpenMenu, accessibilityLabel: 'More options' },
      ]}
      chips={quickLabels.map((label) => ({ label }))}
    />
  );
}

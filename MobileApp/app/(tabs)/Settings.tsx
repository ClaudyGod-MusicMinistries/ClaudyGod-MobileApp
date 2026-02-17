// app/(tabs)/Settings.tsx
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme, useColorSchemeToggle } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/layout/Screen';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';

type SettingItem = {
  icon: string;
  label: string;
  hint?: string;
  action?: () => void;
  type?: 'switch';
  value?: boolean;
  onToggle?: (value: boolean) => void;
};

export default function Settings() {
  const theme = useAppTheme();
  const toggleColorScheme = useColorSchemeToggle();
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);

  const sections = [
    {
      title: 'Account',
      description: 'Identity, privacy and subscriptions',
      items: [
        { icon: 'person', label: 'Profile', hint: 'Name, email and personal details', action: () => router.push('/profile') },
        { icon: 'security', label: 'Privacy & Security', hint: 'Data controls and permissions', action: () => router.push('/settingsPage/Privacy') },
        { icon: 'volunteer-activism', label: 'Donate', hint: 'Contribution plans and checkout', action: () => router.push('/settingsPage/Donate') },
      ] as SettingItem[],
    },
    {
      title: 'Playback',
      description: 'Streaming quality and listening behavior',
      items: [
        { icon: 'play-arrow', label: 'Auto-play', hint: 'Continue to related media', type: 'switch', value: autoPlay, onToggle: setAutoPlay },
        { icon: 'hd', label: 'High quality', hint: 'Use more data for better sound', type: 'switch', value: highQuality, onToggle: setHighQuality },
      ] as SettingItem[],
    },
    {
      title: 'Preferences',
      description: 'App behavior and interface preferences',
      items: [
        { icon: 'notifications', label: 'Notifications', hint: 'Reminders for lives and releases', type: 'switch', value: notifications, onToggle: setNotifications },
        { icon: 'dark-mode', label: 'Dark mode', hint: 'Use system-aware dark interface', type: 'switch', value: theme.scheme === 'dark', onToggle: toggleColorScheme },
      ] as SettingItem[],
    },
    {
      title: 'Support',
      description: 'Support resources and product information',
      items: [
        { icon: 'help', label: 'Help & Support', hint: 'FAQs and contact channels', action: () => router.push('/settingsPage/help') },
        { icon: 'info', label: 'About', hint: 'Product mission and team', action: () => router.push('/settingsPage/About') },
        { icon: 'rate-review', label: 'Rate App', hint: 'Share product feedback', action: () => router.push('/settingsPage/Rate') },
      ] as SettingItem[],
    },
  ];

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: theme.spacing.md }}
      >
        <Screen>
          <FadeIn>
            <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
              <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                Settings
              </CustomText>
              <CustomText style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                Manage account, playback and app behavior from one place.
              </CustomText>
            </SurfaceCard>
          </FadeIn>

          {sections.map((section, sectionIndex) => (
            <FadeIn key={section.title} delay={80 + sectionIndex * 70}>
              <View style={{ marginTop: theme.spacing.lg }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  {section.title}
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                  {section.description}
                </CustomText>
                <SurfaceCard style={{ marginTop: theme.spacing.sm, paddingVertical: 2 }}>
                  {section.items.map((item, index) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={item.action}
                      disabled={item.type === 'switch'}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        padding: theme.spacing.md,
                        borderBottomWidth: index === section.items.length - 1 ? 0 : 1,
                        borderBottomColor: theme.colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${theme.colors.primary}18`,
                          marginRight: theme.spacing.md,
                        }}
                      >
                        <MaterialIcons name={item.icon as any} size={18} color={theme.colors.primary} />
                      </View>
                      <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
                        <CustomText variant="body" style={{ color: theme.colors.text.primary }}>
                          {item.label}
                        </CustomText>
                        {item.hint ? (
                          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                            {item.hint}
                          </CustomText>
                        ) : null}
                      </View>
                      {item.type === 'switch' ? (
                        <Switch
                          value={Boolean(item.value)}
                          onValueChange={item.onToggle}
                          trackColor={{ true: theme.colors.border, false: theme.colors.border }}
                          thumbColor={item.value ? theme.colors.primary : theme.colors.text.secondary}
                        />
                      ) : (
                        <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.secondary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </SurfaceCard>
              </View>
            </FadeIn>
          ))}
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

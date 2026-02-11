// app/(tabs)/Settings.tsx
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme, useColorSchemeToggle } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/layout/Screen';

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
      items: [
        { icon: 'person', label: 'Profile', action: () => console.log('profile') },
        { icon: 'security', label: 'Privacy & Security', action: () => router.push('/settingsPage/Privacy') },
        { icon: 'volunteer-activism', label: 'Donate', action: () => router.push('/settingsPage/Donate') },
      ],
    },
    {
      title: 'Playback',
      items: [
        { icon: 'play-arrow', label: 'Auto-play', type: 'switch', value: autoPlay, onToggle: setAutoPlay },
        { icon: 'hd', label: 'High quality', type: 'switch', value: highQuality, onToggle: setHighQuality },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications', label: 'Notifications', type: 'switch', value: notifications, onToggle: setNotifications },
        { icon: 'dark-mode', label: 'Dark mode', type: 'switch', value: true, onToggle: toggleColorScheme },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help', label: 'Help & Support', action: () => router.push('/settingsPage/help') },
        { icon: 'info', label: 'About', action: () => router.push('/settingsPage/About') },
        { icon: 'rate-review', label: 'Rate App', action: () => router.push('/settingsPage/Rate') },
      ],
    },
  ];

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: theme.spacing.md }}
      >
        <Screen>
          <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
            Settings
          </CustomText>
          <CustomText style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
            Personalize playback, alerts, and account preferences.
          </CustomText>

          {sections.map((section) => (
            <View key={section.title} style={{ marginTop: theme.spacing.lg }}>
              <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                {section.title}
              </CustomText>
              <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.sm }}>
                {section.items.map((item: any) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.action}
                    disabled={item.type === 'switch'}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: theme.spacing.md,
                      borderRadius: theme.radius.lg,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
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
                    <CustomText style={{ color: theme.colors.text.primary, flex: 1 }}>
                      {item.label}
                    </CustomText>
                    {item.type === 'switch' ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ true: theme.colors.border, false: theme.colors.border }}
                        thumbColor={item.value ? theme.colors.primary : theme.colors.text.secondary}
                      />
                    ) : (
                      <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.secondary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

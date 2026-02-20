import React from 'react';
import { Image, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './settingsPage/Scaffold';
import { CustomText } from '../components/CustomText';
import { useAppTheme } from '../util/colorScheme';
import { spacing } from '../styles/designTokens';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { FadeIn } from '../components/ui/FadeIn';
import { TVTouchable } from '../components/ui/TVTouchable';
import { AppButton } from '../components/ui/AppButton';

const groups = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Personal Details' },
      { icon: 'workspace-premium', label: 'Subscription Plan' },
      { icon: 'credit-card', label: 'Billing Methods' },
    ],
  },
  {
    title: 'Experience',
    items: [
      { icon: 'notifications-none', label: 'Notifications' },
      { icon: 'tune', label: 'Playback Preferences' },
      { icon: 'devices', label: 'Connected Devices' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-outline', label: 'Help Center' },
      { icon: 'security', label: 'Privacy & Security' },
    ],
  },
];

export default function Profile() {
  const theme = useAppTheme();

  return (
    <SettingsScaffold
      title="Profile"
      subtitle="Manage your account and listening environment."
      hero={
        <FadeIn>
          <SurfaceCard
            tone="subtle"
            style={{
              padding: spacing.lg,
              marginBottom: spacing.lg,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 124,
                height: 124,
                borderRadius: 62,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(205,182,255,0.44)',
                backgroundColor: 'rgba(154,107,255,0.16)',
              }}
            >
              <Image
                source={require('../assets/images/ClaudyGoLogo.webp')}
                style={{ width: 98, height: 98, borderRadius: 49 }}
              />
            </View>

            <CustomText
              variant="display"
              style={{
                color: theme.colors.text.primary,
                marginTop: 14,
                fontSize: 28,
                lineHeight: 34,
                fontFamily: 'ClashDisplay_700Bold',
              }}
            >
              Claudy God
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
              hello@claudygodmusic.com
            </CustomText>

            <View
              style={{
                marginTop: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(205,182,255,0.48)',
                backgroundColor: 'rgba(154,107,255,0.12)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MaterialIcons name="workspace-premium" size={15} color={theme.colors.primary} />
              <CustomText variant="label" style={{ color: theme.colors.primary }}>
                Premium Worship Pass
              </CustomText>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={90}>
        <AppButton title="Edit Profile" fullWidth size="lg" />
      </FadeIn>

      {groups.map((group, groupIndex) => (
        <FadeIn key={group.title} delay={120 + groupIndex * 35}>
          <SurfaceCard style={{ marginTop: spacing.md, padding: spacing.md }}>
            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: 10 }}>
              {group.title}
            </CustomText>

            <View style={{ gap: 8 }}>
              {group.items.map((item) => (
                <TVTouchable
                  key={item.label}
                  onPress={() => console.log(item.label)}
                  style={{
                    minHeight: 54,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(136,120,168,0.22)',
                    backgroundColor: theme.colors.surfaceAlt,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(154,107,255,0.16)',
                      marginRight: 10,
                    }}
                  >
                    <MaterialIcons name={item.icon as any} size={17} color={theme.colors.primary} />
                  </View>

                  <CustomText variant="body" style={{ color: theme.colors.text.primary, flex: 1 }}>
                    {item.label}
                  </CustomText>

                  <MaterialIcons name="chevron-right" size={20} color={theme.colors.text.secondary} />
                </TVTouchable>
              ))}
            </View>
          </SurfaceCard>
        </FadeIn>
      ))}

      <FadeIn delay={240}>
        <AppButton
          title="Log Out"
          variant="ghost"
          fullWidth
          size="lg"
          leftIcon={<MaterialIcons name="logout" size={18} color="#D79CAF" />}
          textColor="#D79CAF"
          onPress={() => console.log('logout')}
          style={{
            marginTop: spacing.lg,
            borderWidth: 1,
            borderColor: 'rgba(215,156,175,0.34)',
            borderRadius: 16,
            backgroundColor: 'rgba(115,42,72,0.18)',
          }}
        />
      </FadeIn>
    </SettingsScaffold>
  );
}

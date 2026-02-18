import React from 'react';
import { View, Linking, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';

const sections = [
  {
    title: 'What we collect',
    items: [
      'Account basics (email and name) for authentication and support.',
      'Playback activity to continue from where you stopped.',
      'Device diagnostics to improve stability and crash recovery.',
      'Optional download metadata to manage offline storage.',
    ],
  },
  {
    title: 'How we use it',
    items: [
      'Personalize recommendations and curated mixes.',
      'Sync favorites and library across devices.',
      'Improve quality of service for video and audio playback.',
      'Protect your account from abuse and suspicious activity.',
    ],
  },
  {
    title: 'Your controls',
    items: [
      'Request full data export anytime.',
      'Delete account and purge personal profile data.',
      'Disable product and marketing emails.',
      'Reset recommendations by clearing activity history.',
    ],
  },
  {
    title: 'Third-party services',
    items: [
      'Analytics and crash monitoring (aggregated only).',
      'Global CDN for faster stream delivery.',
      'Certified payment processors for subscriptions.',
      'We do not sell personal data.',
    ],
  },
];

export default function Privacy() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  return (
    <SettingsScaffold
      title="Privacy & Security"
      subtitle="Clear controls, transparent processing, enterprise practices."
      hero={
        <FadeIn>
          <SurfaceCard tone="subtle" style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: `${theme.colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}
              >
                <MaterialIcons name="shield" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                  Your data. Your control.
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                  Export, update, or remove your data at any time.
                </CustomText>
              </View>
            </View>
            <View style={{ marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <AppButton
                title="Export data"
                size="sm"
                variant="outline"
                fullWidth={isCompact}
                onPress={() => console.log('Export data')}
              />
              <AppButton
                title="Delete account"
                size="sm"
                variant="ghost"
                fullWidth={isCompact}
                onPress={() => console.log('Delete account')}
              />
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      {sections.map((section, index) => (
        <FadeIn key={section.title} delay={80 + index * 50}>
          <SurfaceCard style={{ padding: spacing.md, marginBottom: spacing.sm }}>
            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
              {section.title}
            </CustomText>
            {section.items.map((item) => (
              <View
                key={item}
                style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs }}
              >
                <MaterialIcons name="check-circle" size={16} color={theme.colors.primary} style={{ marginTop: 2 }} />
                <CustomText
                  variant="caption"
                  style={{ color: theme.colors.text.secondary, marginLeft: spacing.sm, flex: 1 }}
                >
                  {item}
                </CustomText>
              </View>
            ))}
          </SurfaceCard>
        </FadeIn>
      ))}

      <FadeIn delay={300}>
        <TVTouchable onPress={() => Linking.openURL('mailto:privacy@claudygodmusic.com')} showFocusBorder={false}>
          <SurfaceCard tone="subtle" style={{ padding: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xl }}>
            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
              Need data exported or removed?
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
              Email privacy@claudygodmusic.com and our team responds within 24 hours.
            </CustomText>
          </SurfaceCard>
        </TVTouchable>
      </FadeIn>
    </SettingsScaffold>
  );
}

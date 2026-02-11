// app/settingsPage/Privacy.tsx
import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing, radius } from '../../styles/designTokens';

const sections = [
  {
    title: 'What we collect',
    items: [
      'Account basics (email, name) for login and support',
      'Playback activity to keep your place across devices',
      'Device + diagnostics to improve app stability',
      'Optional downloads metadata to manage storage',
    ],
  },
  {
    title: 'How we use it',
    items: [
      'Personalize recommendations and mixes',
      'Sync library/favorites across phone, car, and TV',
      'Detect crashes and improve stream quality',
      'Keep your account secure (fraud detection, abuse)',
    ],
  },
  {
    title: 'Your controls',
    items: [
      'Export your data anytime',
      'Delete account + purge personal data',
      'Disable ad/promo emails',
      'Reset recommendations by clearing history',
    ],
  },
  {
    title: 'Third parties',
    items: [
      'Analytics and crash reporting (aggregated)',
      'No selling of personal data—ever',
      'Content delivery network for fast streams',
      'Payment processors for subscriptions',
    ],
  },
];

export default function Privacy() {
  const theme = useAppTheme();

  const Card: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: spacing.md,
      }}
    >
      <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 18, marginBottom: spacing.sm }}>
        {title}
      </CustomText>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs }}>
          <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} style={{ marginTop: 2 }} />
          <CustomText style={{ color: theme.colors.text.secondary, marginLeft: spacing.sm, flex: 1, lineHeight: 20 }}>
            {item}
          </CustomText>
        </View>
      ))}
    </View>
  );

  return (
    <SettingsScaffold
      title="Privacy & Security"
      subtitle="Clear policies, fast controls, zero data selling."
      hero={
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: spacing.lg,
          }}
        >
          <CustomText style={{ color: theme.colors.text.primary, fontWeight: '800', fontSize: 20, marginBottom: spacing.sm }}>
            Your data. Your call.
          </CustomText>
          <CustomText style={{ color: theme.colors.text.secondary, lineHeight: 22 }}>
            We keep only what’s needed to stream seamlessly across mobile and TV, and you can export or delete it any time.
          </CustomText>
        </View>
      }
    >
      {sections.map((section) => (
        <Card key={section.title} title={section.title} items={section.items} />
      ))}

      <View
        style={{
          backgroundColor: `${theme.colors.primary}12`,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          marginTop: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        <CustomText style={{ color: theme.colors.text.primary, fontWeight: '700', fontSize: 16 }}>
          Need anything removed or exported?
        </CustomText>
        <CustomText style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
          Email privacy@claudygodmusic.com and we’ll respond within 24 hours.
        </CustomText>
      </View>
    </SettingsScaffold>
  );
}

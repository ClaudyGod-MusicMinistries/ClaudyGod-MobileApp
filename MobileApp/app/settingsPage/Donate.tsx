// app/settingsPage/Donate.tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing, radius } from '../../styles/designTokens';

const tiers = [
  { id: 't1', title: 'Supporter', amount: '$5', description: 'Keep the streams flowing.' },
  { id: 't2', title: 'Partner', amount: '$15', description: 'Fund new content and live sessions.' },
  { id: 't3', title: 'Patron', amount: '$30', description: 'Sponsor production + outreach.' },
];

const actions = [
  { icon: 'payments', label: 'One‑time donation' },
  { icon: 'autorenew', label: 'Monthly support' },
  { icon: 'card-giftcard', label: 'Gift a subscription' },
];

export default function Donate() {
  const theme = useAppTheme();

  return (
    <SettingsScaffold
      title="Support ClaudyGod"
      subtitle="Simple, transparent support for the mission."
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
          <CustomText style={{ color: theme.colors.text.primary, fontWeight: '800', fontSize: 18 }}>
            Keep worship accessible everywhere.
          </CustomText>
          <CustomText style={{ color: theme.colors.text.secondary, marginTop: 6, lineHeight: 18, fontSize: 12 }}>
            Your support funds streaming costs, content production, and TV‑ready experiences.
          </CustomText>
        </View>
      }
    >
      {/* Primary actions */}
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}
            onPress={() => console.log(action.label)}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: `${theme.colors.primary}18`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              <MaterialIcons name={action.icon as any} size={18} color={theme.colors.primary} />
            </View>
            <CustomText style={{ color: theme.colors.text.primary, fontSize: 13, flex: 1 }}>
              {action.label}
            </CustomText>
            <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Suggested tiers */}
      <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 15 }}>
        Suggested tiers
      </CustomText>
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        {tiers.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}
            onPress={() => console.log('Select tier', tier.id)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <CustomText style={{ color: theme.colors.text.primary, fontWeight: '700', fontSize: 14 }}>
                {tier.title}
              </CustomText>
              <CustomText style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 14 }}>
                {tier.amount}
              </CustomText>
            </View>
            <CustomText style={{ color: theme.colors.text.secondary, marginTop: 6, fontSize: 12 }}>
              {tier.description}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer note */}
      <View
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <CustomText style={{ color: theme.colors.text.secondary, fontSize: 12 }}>
          Donations are optional and support content creation. You can cancel anytime.
        </CustomText>
      </View>
    </SettingsScaffold>
  );
}

// app/settingsPage/Donate.tsx
import React from 'react';
import { View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing, radius } from '../../styles/designTokens';
import { FadeIn } from '../../components/ui/FadeIn';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';

const tiers = [
  { id: 't1', title: 'Supporter', amount: '$5', description: 'Keep the streams flowing.', tag: 'Starter' },
  { id: 't2', title: 'Partner', amount: '$15', description: 'Fund new content and live sessions.', tag: 'Most Popular' },
  { id: 't3', title: 'Patron', amount: '$30', description: 'Sponsor production + outreach.', tag: 'Premium' },
];

const actions = [
  { icon: 'payments', label: 'One-time donation', subtitle: 'Single secure payment' },
  { icon: 'autorenew', label: 'Monthly support', subtitle: 'Auto-renew each month' },
  { icon: 'card-giftcard', label: 'Gift a subscription', subtitle: 'Sponsor someone else' },
];

export default function Donate() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <SettingsScaffold
      title="Support ClaudyGod"
      subtitle="Simple, transparent support for the mission."
      hero={
        <FadeIn>
          <SurfaceCard
            style={{
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              backgroundColor: theme.colors.surface,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: radius.pill,
                backgroundColor: `${theme.colors.primary}18`,
                marginBottom: spacing.sm,
              }}
            >
              <CustomText variant="label" style={{ color: theme.colors.primary }}>
                Secure giving
              </CustomText>
            </View>
            <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
              Keep worship accessible everywhere
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 8 }}>
              Your support funds streaming costs, content production, and TV-ready experiences.
            </CustomText>
            <View
              style={{
                marginTop: spacing.md,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
              }}
            >
              {[
                { value: '1.2M+', label: 'Monthly streams' },
                { value: '99.9%', label: 'Uptime' },
                { value: '48', label: 'Countries' },
              ].map((metric) => (
                <View
                  key={metric.label}
                  style={{
                    width: isCompact ? '100%' : '31.5%',
                    padding: spacing.sm,
                    borderRadius: radius.md,
                    backgroundColor: theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                    {metric.value}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                    {metric.label}
                  </CustomText>
                </View>
              ))}
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={80}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
          Payment method
        </CustomText>
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
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
                backgroundColor: theme.colors.surfaceAlt,
              }}
              onPress={() => console.log(action.label)}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: `${theme.colors.primary}14`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}
              >
                <MaterialIcons name={action.icon as any} size={16} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <CustomText variant="body" style={{ color: theme.colors.text.primary }}>
                  {action.label}
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                  {action.subtitle}
                </CustomText>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={140}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
          Suggested tiers
        </CustomText>
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {tiers.map((tier) => (
            <SurfaceCard
              key={tier.id}
              style={{
                padding: spacing.md,
                backgroundColor: tier.id === 't2' ? `${theme.colors.primary}12` : theme.colors.surface,
                borderColor: tier.id === 't2' ? `${theme.colors.primary}55` : theme.colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                    {tier.title}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                    {tier.tag}
                  </CustomText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <CustomText variant="subtitle" style={{ color: theme.colors.primary }}>
                    {tier.amount}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                    per month
                  </CustomText>
                </View>
              </View>
              <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                {tier.description}
              </CustomText>
              <View style={{ marginTop: spacing.md }}>
                <AppButton
                  title={`Choose ${tier.title}`}
                  size="sm"
                  variant={tier.id === 't2' ? 'primary' : 'outline'}
                  fullWidth
                  onPress={() => console.log('Select tier', tier.id)}
                />
              </View>
            </SurfaceCard>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={220}>
        <SurfaceCard
          style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            backgroundColor: theme.colors.surfaceAlt,
          }}
        >
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
            Donations are optional and support content creation. You can cancel anytime.
          </CustomText>
        </SurfaceCard>
      </FadeIn>
    </SettingsScaffold>
  );
}

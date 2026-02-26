import React, { useMemo, useState } from 'react';
import { Alert, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing, radius } from '../../styles/designTokens';
import { FadeIn } from '../../components/ui/FadeIn';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createDonationIntent } from '../../services/userFlowService';

type DonateMethod = {
  id: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  subtitle: string;
  badge?: string;
};

type SupportPlan = {
  id: string;
  name: string;
  amount: string;
  period: 'once' | 'monthly';
  note: string;
  featured?: boolean;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

type ImpactBreakdownItem = {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

const quickAmounts = ['$5', '$10', '$25', '$50', '$100'];

const supportMethods: DonateMethod[] = [
  {
    id: 'card',
    icon: 'credit-card',
    label: 'Card / Apple Pay / Google Pay',
    subtitle: 'Fast checkout with secure payment providers',
    badge: 'Recommended',
  },
  {
    id: 'bank',
    icon: 'account-balance',
    label: 'Bank transfer',
    subtitle: 'Manual transfer and reconciliation support',
  },
  {
    id: 'sponsor',
    icon: 'volunteer-activism',
    label: 'Sponsor a live session',
    subtitle: 'Fund one broadcast or a ministry campaign slot',
  },
];

const supportPlans: SupportPlan[] = [
  {
    id: 'supporter',
    name: 'Supporter',
    amount: '$10',
    period: 'monthly',
    note: 'Helps cover storage, bandwidth and publishing operations.',
    icon: 'favorite-border',
  },
  {
    id: 'partner',
    name: 'Partner',
    amount: '$25',
    period: 'monthly',
    note: 'Supports music drops, live streaming and content production.',
    featured: true,
    icon: 'auto-awesome',
  },
  {
    id: 'mission',
    name: 'Mission Gift',
    amount: '$100',
    period: 'once',
    note: 'One-time support for outreach campaigns and platform improvements.',
    icon: 'public',
  },
];

const impactBreakdown: ImpactBreakdownItem[] = [
  { label: 'Streaming & CDN', value: 42, icon: 'wifi-tethering' as const },
  { label: 'Production & Editing', value: 33, icon: 'movie-edit' as const },
  { label: 'Outreach & Events', value: 25, icon: 'groups' as const },
];

export default function Donate() {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const { width } = useWindowDimensions();
  const { config } = useMobileAppConfig();
  const isCompact = width < 380;
  const isTablet = width >= 768;

  const configuredQuickAmounts = config?.donate.quickAmounts ?? quickAmounts;
  const configuredMethods: DonateMethod[] = (config?.donate.methods ?? supportMethods).map((method) => ({
    ...method,
    icon: method.icon as DonateMethod['icon'],
  }));
  const configuredPlans: SupportPlan[] = (config?.donate.plans ?? supportPlans).map((plan) => ({
    ...plan,
    icon: plan.icon as SupportPlan['icon'],
  }));
  const configuredImpactBreakdown: ImpactBreakdownItem[] = (config?.donate.impactBreakdown ?? impactBreakdown).map((item) => ({
    ...item,
    icon: item.icon as ImpactBreakdownItem['icon'],
  }));
  const configuredCurrency = config?.donate.currency ?? 'USD';

  const [selectedAmount, setSelectedAmount] = useState<string>('$25');
  const [donationMode, setDonationMode] = useState<'once' | 'monthly'>('once');
  const [selectedMethod, setSelectedMethod] = useState<string>((config?.donate.methods?.[0]?.id ?? supportMethods[0].id));

  const selectedPlan = useMemo(
    () => configuredPlans.find((plan) => plan.period === donationMode && (donationMode === 'monthly' ? plan.featured : true)),
    [configuredPlans, donationMode],
  );

  const ui = {
    heroBg: isDark ? 'rgba(10,8,17,0.9)' : '#FFFFFF',
    heroBorder: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
    panelBg: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surfaceAlt,
    panelBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.06)',
    muted: isDark ? 'rgba(194,185,220,0.92)' : theme.colors.text.secondary,
    subtle: isDark ? 'rgba(176,167,202,0.9)' : 'rgba(108,99,134,0.92)',
    accentSoft: isDark ? 'rgba(154,107,255,0.14)' : 'rgba(109,40,217,0.08)',
    accentLine: isDark ? 'rgba(216,194,255,0.22)' : 'rgba(109,40,217,0.14)',
    successTint: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(22,163,74,0.08)',
  } as const;

  const onPlaceholderAction = (label: string) => {
    Alert.alert('Checkout setup pending', `${label} will be connected when the payment backend is configured.`);
  };

  const onDonateNow = () => {
    const method = configuredMethods.find((item) => item.id === selectedMethod);
    void createDonationIntent({
      amount: selectedAmount,
      mode: donationMode,
      methodId: selectedMethod,
      currency: configuredCurrency,
      planId: selectedPlan?.id,
      metadata: { screen: 'donate' },
    })
      .then(() => {
        Alert.alert(
          'Donation intent created',
          `${donationMode === 'monthly' ? 'Monthly' : 'One-time'} ${selectedAmount} via ${method?.label ?? 'selected method'} is ready for payment provider processing.`,
        );
      })
      .catch((error) => {
        Alert.alert('Donation setup failed', error instanceof Error ? error.message : 'Please try again.');
      });
  };

  return (
    <SettingsScaffold
      title="Donate"
      subtitle="Support the ministry with secure giving options."
      hero={
        <FadeIn>
          <SurfaceCard
            style={{
              borderRadius: 22,
              borderWidth: 1,
              borderColor: ui.heroBorder,
              backgroundColor: ui.heroBg,
              padding: 0,
              marginBottom: spacing.lg,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(124,58,237,0.26)', 'rgba(31,21,58,0.08)', 'rgba(0,0,0,0)']
                  : ['rgba(109,40,217,0.14)', 'rgba(124,58,237,0.05)', 'rgba(255,255,255,0)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180 }}
            />

            <View style={{ padding: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View
                  style={{
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: ui.accentLine,
                    backgroundColor: ui.accentSoft,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <MaterialIcons name="lock-outline" size={14} color={theme.colors.primary} />
                  <CustomText variant="caption" style={{ color: theme.colors.primary }}>
                    Secure Giving
                  </CustomText>
                </View>

                <View
                  style={{
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: ui.panelBorder,
                    backgroundColor: ui.successTint,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <CustomText variant="caption" style={{ color: isDark ? '#86EFAC' : '#15803D' }}>
                    Transparent use of funds
                  </CustomText>
                </View>
              </View>

              <CustomText variant="heading" style={{ color: theme.colors.text.primary, marginTop: 12 }}>
                Support worship, live broadcasts and ministry content
              </CustomText>
              <CustomText variant="body" style={{ color: ui.muted, marginTop: 8 }}>
                Choose a one-time gift or monthly support plan. Payment providers and backend processing can be connected without changing this page layout.
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
                  { label: 'Streams/month', value: '1.2M+' },
                  { label: 'Devices', value: 'Mobile + TV' },
                  { label: 'Coverage', value: 'Global' },
                ].map((metric) => (
                  <View
                    key={metric.label}
                    style={{
                      width: isCompact ? '100%' : isTablet ? '31.8%' : '31%',
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: ui.panelBorder,
                      backgroundColor: ui.panelBg,
                      padding: 10,
                    }}
                  >
                    <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                      {metric.value}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: ui.subtle, marginTop: 2 }}>
                      {metric.label}
                    </CustomText>
                  </View>
                ))}
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={70}>
        <SurfaceCard style={{ padding: spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            Quick donation
          </CustomText>
          <CustomText variant="caption" style={{ color: ui.muted, marginTop: 3 }}>
            Select amount, payment mode and method. Checkout action is ready for backend integration.
          </CustomText>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {(['once', 'monthly'] as const).map((mode) => {
              const active = donationMode === mode;
              return (
                <TVTouchable
                  key={mode}
                  onPress={() => setDonationMode(mode)}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: active ? ui.accentLine : ui.panelBorder,
                    backgroundColor: active ? ui.accentSoft : ui.panelBg,
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <CustomText variant="label" style={{ color: active ? theme.colors.primary : theme.colors.text.primary }}>
                    {mode === 'once' ? 'One-time' : 'Monthly'}
                  </CustomText>
                </TVTouchable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {configuredQuickAmounts.map((amount) => {
              const active = selectedAmount === amount;
              return (
                <TVTouchable
                  key={amount}
                  onPress={() => setSelectedAmount(amount)}
                  style={{
                    width: isCompact ? '31%' : '18.4%',
                    minWidth: 58,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: active ? ui.accentLine : ui.panelBorder,
                    backgroundColor: active ? ui.accentSoft : ui.panelBg,
                    paddingVertical: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <CustomText variant="label" style={{ color: active ? theme.colors.primary : theme.colors.text.primary }}>
                    {amount}
                  </CustomText>
                </TVTouchable>
              );
            })}
          </View>

          <View style={{ gap: 8, marginTop: 14 }}>
            {configuredMethods.map((method) => {
              const active = selectedMethod === method.id;
              return (
                <TVTouchable
                  key={method.id}
                  onPress={() => setSelectedMethod(method.id)}
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? ui.accentLine : ui.panelBorder,
                    backgroundColor: active ? ui.accentSoft : ui.panelBg,
                    padding: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      borderWidth: 1,
                      borderColor: active ? ui.accentLine : ui.panelBorder,
                      backgroundColor: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <MaterialIcons name={method.icon} size={18} color={active ? theme.colors.primary : theme.colors.text.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
                        {method.label}
                      </CustomText>
                      {method.badge ? (
                        <View
                          style={{
                            borderRadius: radius.pill,
                            borderWidth: 1,
                            borderColor: ui.accentLine,
                            backgroundColor: ui.accentSoft,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                          }}
                        >
                          <CustomText variant="caption" style={{ color: theme.colors.primary }}>
                            {method.badge}
                          </CustomText>
                        </View>
                      ) : null}
                    </View>
                    <CustomText variant="caption" style={{ color: ui.muted, marginTop: 2 }}>
                      {method.subtitle}
                    </CustomText>
                  </View>
                  {active ? <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} /> : null}
                </TVTouchable>
              );
            })}
          </View>

          <View style={{ marginTop: 14 }}>
            <AppButton
              title={`Give ${selectedAmount}${donationMode === 'monthly' ? ' monthly' : ' now'}`}
              fullWidth
              onPress={onDonateNow}
              leftIcon={<MaterialIcons name="favorite" size={16} color={theme.colors.text.inverse} />}
            />
          </View>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={120}>
        <View style={{ marginTop: spacing.lg }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            Support plans
          </CustomText>
          <CustomText variant="caption" style={{ color: ui.muted, marginTop: 3 }}>
            Structured options for individual supporters and recurring partners.
          </CustomText>

          <View style={{ gap: 10, marginTop: 10 }}>
            {configuredPlans.map((plan) => (
              <SupportPlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlan?.id === plan.id}
                onChoose={() => {
                  setDonationMode(plan.period);
                  setSelectedAmount(plan.amount);
                }}
              />
            ))}
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={170}>
        <SurfaceCard style={{ marginTop: spacing.lg, padding: spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            Where support goes
          </CustomText>
          <CustomText variant="caption" style={{ color: ui.muted, marginTop: 3 }}>
            Simple visibility into the major areas your support helps fund.
          </CustomText>

          <View style={{ gap: 12, marginTop: 12 }}>
            {configuredImpactBreakdown.map((item) => (
              <ImpactRow key={item.label} label={item.label} value={item.value} icon={item.icon} />
            ))}
          </View>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={220}>
        <SurfaceCard style={{ marginTop: spacing.lg, padding: spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            Donation support
          </CustomText>
          <CustomText variant="caption" style={{ color: ui.muted, marginTop: 3 }}>
            Need invoices, partnership coordination or local payment support?
          </CustomText>

          <View style={{ gap: 8, marginTop: 12 }}>
            <DonateActionRow
              icon="receipt-long"
              title="Request receipt / invoice"
              subtitle="For organizational accounting and support records"
              onPress={() => onPlaceholderAction('Receipt / invoice request')}
            />
            <DonateActionRow
              icon="support-agent"
              title="Contact donations team"
              subtitle="Questions about giving methods and sponsorship setup"
              onPress={() => onPlaceholderAction('Donations support')}
            />
          </View>

          <View
            style={{
              marginTop: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: ui.panelBorder,
              backgroundColor: ui.panelBg,
              padding: 10,
            }}
          >
            <CustomText variant="caption" style={{ color: ui.muted }}>
              Donations are optional. This screen is UI-ready and can be connected to your backend payment and admin reporting flow without redesigning the page.
            </CustomText>
          </View>
        </SurfaceCard>
      </FadeIn>
    </SettingsScaffold>
  );
}

function SupportPlanCard({
  plan,
  selected,
  onChoose,
}: {
  plan: SupportPlan;
  selected: boolean;
  onChoose: () => void;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';
  const ui = {
    bg: selected
      ? isDark
        ? 'rgba(154,107,255,0.1)'
        : 'rgba(109,40,217,0.06)'
      : isDark
        ? 'rgba(12,9,20,0.86)'
        : theme.colors.surface,
    border: selected
      ? isDark
        ? 'rgba(216,194,255,0.26)'
        : 'rgba(109,40,217,0.18)'
      : isDark
        ? 'rgba(255,255,255,0.08)'
        : theme.colors.border,
    muted: isDark ? 'rgba(194,185,220,0.9)' : theme.colors.text.secondary,
    tagBg: selected ? (isDark ? 'rgba(255,255,255,0.04)' : theme.colors.surface) : theme.colors.surfaceAlt,
    tagBorder: selected
      ? isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(20,16,33,0.06)'
      : isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(20,16,33,0.06)',
  } as const;

  return (
    <TVTouchable
      onPress={onChoose}
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: ui.border,
        backgroundColor: ui.bg,
        padding: 12,
      }}
      showFocusBorder={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: ui.tagBorder,
            backgroundColor: ui.tagBg,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <MaterialIcons name={plan.icon} size={18} color={selected ? theme.colors.primary : theme.colors.text.secondary} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
              {plan.name}
            </CustomText>
            {plan.featured ? (
              <View
                style={{
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(216,194,255,0.24)' : 'rgba(109,40,217,0.14)',
                  backgroundColor: isDark ? 'rgba(154,107,255,0.12)' : 'rgba(109,40,217,0.08)',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}
              >
                <CustomText variant="caption" style={{ color: theme.colors.primary }}>
                  Recommended
                </CustomText>
              </View>
            ) : null}
          </View>
          <CustomText variant="caption" style={{ color: ui.muted, marginTop: 2 }}>
            {plan.note}
          </CustomText>
        </View>

        <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
          <CustomText variant="subtitle" style={{ color: selected ? theme.colors.primary : theme.colors.text.primary }}>
            {plan.amount}
          </CustomText>
          <CustomText variant="caption" style={{ color: ui.muted, marginTop: 2 }}>
            {plan.period === 'monthly' ? 'monthly' : 'one-time'}
          </CustomText>
        </View>
      </View>
    </TVTouchable>
  );
}

function ImpactRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name={icon} size={16} color={theme.colors.primary} />
          <CustomText variant="caption" style={{ color: theme.colors.text.primary, marginLeft: 6 }}>
            {label}
          </CustomText>
        </View>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
          {value}%
        </CustomText>
      </View>
      <View
        style={{
          height: 8,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.colors.surfaceAlt,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(20,16,33,0.05)',
        }}
      >
        <LinearGradient
          colors={isDark ? ['#7C3AED', '#9A6BFF'] : ['#6D28D9', '#8B5CF6']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: `${value}%`, height: '100%' }}
        />
      </View>
    </View>
  );
}

function DonateActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const isDark = theme.scheme === 'dark';

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.border,
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : theme.colors.surface,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      showFocusBorder={false}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,16,33,0.06)',
          backgroundColor: isDark ? 'rgba(154,107,255,0.12)' : 'rgba(109,40,217,0.08)',
          marginRight: 10,
        }}
      >
        <MaterialIcons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: theme.colors.text.primary }}>
          {title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
          {subtitle}
        </CustomText>
      </View>
      <MaterialIcons name="chevron-right" size={18} color={theme.colors.text.secondary} />
    </TVTouchable>
  );
}

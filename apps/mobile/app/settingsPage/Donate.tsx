import React, { useEffect, useMemo, useState } from 'react';
import { Linking, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { FadeIn } from '../../components/ui/FadeIn';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { APP_ROUTES } from '../../util/appRoutes';

type DonateFrequency = 'daily' | 'weekly' | 'monthly';

type DonateMethod = {
  id: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  subtitle: string;
  badge?: string;
};

type DonatePlan = {
  id: string;
  name: string;
  amount: string;
  period: DonateFrequency | 'once';
  note: string;
  featured?: boolean;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

type DonateImpact = {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

function frequencyLabel(value: DonateFrequency) {
  if (value === 'daily') return 'Daily';
  if (value === 'weekly') return 'Weekly';
  return 'Monthly';
}

export default function Donate() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { config } = useMobileAppConfig();
  const isTablet = width >= 768;
  const isCompact = width < 390;
  const donateConfig = config?.donate;

  const quickAmounts = useMemo(() => donateConfig?.quickAmounts ?? [], [donateConfig]);
  const quickAmountsByCurrency = useMemo(
    () => donateConfig?.quickAmountsByCurrency ?? {},
    [donateConfig],
  );
  const currencyOptions = useMemo(() => donateConfig?.currencyOptions ?? [], [donateConfig]);
  const methods = useMemo<DonateMethod[]>(
    () =>
      (donateConfig?.methods ?? []).map((method) => ({
        id: method.id,
        icon: method.icon as DonateMethod['icon'],
        label: method.label,
        subtitle: method.subtitle,
        badge: method.badge,
      })),
    [donateConfig],
  );
  const plans = useMemo<DonatePlan[]>(
    () =>
      (donateConfig?.plans ?? []).map((plan) => ({
        id: plan.id,
        name: plan.name,
        amount: plan.amount,
        period: plan.period,
        note: plan.note,
        featured: plan.featured,
        icon: plan.icon as DonatePlan['icon'],
      })),
    [donateConfig],
  );
  const impactBreakdown = useMemo<DonateImpact[]>(
    () =>
      (donateConfig?.impactBreakdown ?? []).map((impact) => ({
        label: impact.label,
        value: impact.value,
        icon: impact.icon as DonateImpact['icon'],
      })),
    [donateConfig],
  );

  const defaultCurrency = useMemo(() => (donateConfig?.currency ?? 'USD').toUpperCase(), [donateConfig]);
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);
  const [selectedFrequency, setSelectedFrequency] = useState<DonateFrequency>('monthly');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');

  const activeQuickAmounts = useMemo(
    () => quickAmountsByCurrency[selectedCurrency] ?? quickAmounts,
    [quickAmounts, quickAmountsByCurrency, selectedCurrency],
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.period === selectedFrequency) ?? plans[0] ?? null,
    [plans, selectedFrequency],
  );

  const selectedMethod = useMemo(
    () => methods.find((method) => method.id === selectedMethodId) ?? methods[0] ?? null,
    [methods, selectedMethodId],
  );

  const hasGivingConfiguration =
    currencyOptions.length > 0 || quickAmounts.length > 0 || methods.length > 0 || plans.length > 0;

  useEffect(() => {
    setSelectedCurrency(defaultCurrency);
  }, [defaultCurrency]);

  useEffect(() => {
    if (activeQuickAmounts.length > 0 && activeQuickAmounts.indexOf(selectedAmount) === -1) {
      setSelectedAmount(activeQuickAmounts[0]);
    }
  }, [activeQuickAmounts, selectedAmount]);

  useEffect(() => {
    if (methods.length > 0 && !methods.some((method) => method.id === selectedMethodId)) {
      setSelectedMethodId(methods[0].id);
    }
  }, [methods, selectedMethodId]);

  const supportEmail = config?.privacy?.contactEmail ?? 'support@claudygod.org';

  const continueToReview = () => {
    if (!selectedAmount) {
      return;
    }

    router.push({
      pathname: APP_ROUTES.settingsPages.payment,
      params: {
        amount: selectedAmount,
        frequency: selectedFrequency,
        methodId: selectedMethod?.id ?? '',
        methodLabel: selectedMethod?.label ?? '',
        currency: selectedCurrency,
        planId: selectedPlan?.id ?? '',
      },
    });
  };

  const contactGivingSupport = () => {
    const subject = encodeURIComponent('Giving support request');
    const body = encodeURIComponent('Hello, I need help with giving on the ClaudyGod app.');
    void Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <SettingsScaffold
      title="Giving"
      subtitle="Support worship, live broadcasts, and ministry work."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
            <View style={{ flexDirection: isTablet ? 'row' : 'column', gap: theme.spacing.lg, alignItems: isTablet ? 'center' : 'flex-start' }}>
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.14)' : 'rgba(124,58,237,0.08)',
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <MaterialIcons name="volunteer-activism" size={34} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  Secure giving
                </CustomText>
                <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 8 }}>
                  Give with clarity and confidence
                </CustomText>
                <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8, maxWidth: 620 }}>
                  Select an amount and continue to a clean review screen before choosing the final giving route.
                </CustomText>
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      {!hasGivingConfiguration ? (
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Giving options are being prepared
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            The giving flow is not available in the app right now. Contact support for available giving instructions.
          </CustomText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            <AppButton title="Contact support" onPress={contactGivingSupport} />
            <AppButton title="Help center" variant="secondary" onPress={() => router.push(APP_ROUTES.settingsPages.help)} />
          </View>
        </SurfaceCard>
      ) : null}

      {currencyOptions.length ? (
        <FadeIn delay={60}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Choose currency
            </CustomText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {currencyOptions.map((option) => {
                const active = selectedCurrency === option.code;
                return (
                  <TVTouchable
                    key={option.code}
                    onPress={() => setSelectedCurrency(option.code)}
                    style={{
                      borderRadius: theme.radius.pill,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? `${theme.colors.primary}1A` : theme.colors.surface,
                      paddingHorizontal: 13,
                      paddingVertical: 9,
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="label" style={{ color: active ? theme.colors.primary : theme.colors.text }}>
                      {option.code} {option.symbol ? `· ${option.symbol}` : ''}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      {activeQuickAmounts.length ? (
        <FadeIn delay={90}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Select amount
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
              Choose the giving amount you want to review.
            </CustomText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
              {activeQuickAmounts.map((amount) => {
                const active = selectedAmount === amount;
                return (
                  <TVTouchable
                    key={`${selectedCurrency}-${amount}`}
                    onPress={() => setSelectedAmount(amount)}
                    style={{
                      width: isCompact ? '47%' : isTablet ? '23.5%' : '30.8%',
                      minHeight: 58,
                      borderRadius: theme.radius.xl,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? `${theme.colors.primary}1A` : theme.colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText variant="heading" style={{ color: active ? theme.colors.primary : theme.colors.text }}>
                      {amount}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
                      {selectedCurrency}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      <FadeIn delay={120}>
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Giving rhythm
          </CustomText>
          <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: 10, marginTop: 14 }}>
            {(['daily', 'weekly', 'monthly'] as DonateFrequency[]).map((frequency) => {
              const active = selectedFrequency === frequency;
              return (
                <TVTouchable
                  key={frequency}
                  onPress={() => setSelectedFrequency(frequency)}
                  style={{
                    flex: 1,
                    minHeight: 58,
                    borderRadius: theme.radius.xl,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? `${theme.colors.primary}1A` : theme.colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <CustomText variant="label" style={{ color: active ? theme.colors.primary : theme.colors.text }}>
                    {frequencyLabel(frequency)}
                  </CustomText>
                </TVTouchable>
              );
            })}
          </View>
        </SurfaceCard>
      </FadeIn>

      {methods.length ? (
        <FadeIn delay={150}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Preferred method
            </CustomText>
            <View style={{ gap: 10, marginTop: 14 }}>
              {methods.map((method) => {
                const active = selectedMethod?.id === method.id;
                return (
                  <TVTouchable
                    key={method.id}
                    onPress={() => setSelectedMethodId(method.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: theme.radius.xl,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? `${theme.colors.primary}14` : theme.colors.surface,
                      padding: theme.spacing.md,
                    }}
                    showFocusBorder={false}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${theme.colors.primary}1A`,
                      }}
                    >
                      <MaterialIcons name={method.icon} size={19} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CustomText variant="label" style={{ color: theme.colors.text }}>
                        {method.label}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
                        {method.subtitle}
                      </CustomText>
                    </View>
                    {method.badge ? (
                      <CustomText variant="caption" style={{ color: theme.colors.primary }}>
                        {method.badge}
                      </CustomText>
                    ) : null}
                  </TVTouchable>
                );
              })}
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      {impactBreakdown.length ? (
        <FadeIn delay={180}>
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Ministry impact
            </CustomText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
              {impactBreakdown.slice(0, 4).map((impact) => (
                <View
                  key={impact.label}
                  style={{
                    width: isCompact ? '100%' : isTablet ? '23.5%' : '47%',
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    padding: theme.spacing.md,
                  }}
                >
                  <MaterialIcons name={impact.icon} size={18} color={theme.colors.primary} />
                  <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 8 }}>
                    {impact.value}%
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
                    {impact.label}
                  </CustomText>
                </View>
              ))}
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      {selectedPlan ? (
        <FadeIn delay={210}>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
            <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
              Selected plan
            </CustomText>
            <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 6 }}>
              {selectedPlan.name}
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
              {selectedPlan.note}
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      <View style={{ gap: 10 }}>
        <AppButton
          title="Review giving"
          size="lg"
          fullWidth
          disabled={!selectedAmount}
          onPress={continueToReview}
          leftIcon={<MaterialIcons name="lock-outline" size={18} color={theme.colors.textInverse} />}
        />
        <AppButton
          title="Need help giving?"
          variant="secondary"
          size="md"
          fullWidth
          onPress={contactGivingSupport}
          leftIcon={<MaterialIcons name="support-agent" size={18} color={theme.colors.text} />}
        />
      </View>
    </SettingsScaffold>
  );
}

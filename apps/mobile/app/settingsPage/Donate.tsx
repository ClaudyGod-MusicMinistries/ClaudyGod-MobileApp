import React, { useEffect, useMemo, useState } from 'react';
import { Linking, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
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

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={{ backgroundColor: '#110E1A', borderRadius: 16, padding: 20, gap: 14 }}>
      <View style={{ gap: 4 }}>
        <CustomText style={{ color: '#F7F2FF', fontSize: 15, fontWeight: '700' }}>{title}</CustomText>
        {subtitle ? (
          <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 13 }}>{subtitle}</CustomText>
        ) : null}
      </View>
      {children}
    </View>
  );
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
  const quickAmountsByCurrency = useMemo(() => donateConfig?.quickAmountsByCurrency ?? {}, [donateConfig]);
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
    if (!selectedAmount) return;
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
      subtitle="Partner with the ministry through a clear, focused giving flow."
      hero={
        <FadeIn>
          {/* Hero banner */}
          <View
            style={{
              backgroundColor: '#8B5CF6',
              borderRadius: 18,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                }}
              >
                <MaterialIcons name="volunteer-activism" size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <CustomText style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Support the ministry
                </CustomText>
                <CustomText style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginTop: 4 }}>
                  Give with clarity and confidence
                </CustomText>
                <CustomText style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 5, lineHeight: 18 }} numberOfLines={2}>
                  Select an amount, choose a rhythm, then review before payment.
                </CustomText>
              </View>
            </View>

            {/* Progress pills */}
            <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: 8, marginTop: 18 }}>
              {[
                { label: selectedAmount ? `${selectedCurrency} ${selectedAmount}` : 'Select amount', icon: 'payments' as const },
                { label: frequencyLabel(selectedFrequency), icon: 'repeat' as const },
                { label: selectedMethod?.label ?? 'Payment method', icon: selectedMethod?.icon ?? ('credit-card' as const) },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    flex: 1,
                    minHeight: 38,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <MaterialIcons name={item.icon} size={15} color="#FFFFFF" />
                  <CustomText style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                    {item.label}
                  </CustomText>
                </View>
              ))}
            </View>
          </View>
        </FadeIn>
      }
    >
      {!hasGivingConfiguration ? (
        <View style={{ backgroundColor: '#110E1A', borderRadius: 16, padding: 24, gap: 12 }}>
          <CustomText style={{ color: '#F7F2FF', fontSize: 17, fontWeight: '700' }}>
            Giving options are being prepared
          </CustomText>
          <CustomText style={{ color: 'rgba(247,242,255,0.45)', fontSize: 13, lineHeight: 20 }}>
            The giving flow is not available in the app right now. Contact support for available giving instructions.
          </CustomText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
            <AppButton title="Contact support" onPress={contactGivingSupport} />
            <AppButton title="Help center" variant="secondary" onPress={() => router.push(APP_ROUTES.settingsPages.help)} />
          </View>
        </View>
      ) : null}

      {currencyOptions.length ? (
        <FadeIn delay={60}>
          <Section title="Currency">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {currencyOptions.map((option) => {
                const active = selectedCurrency === option.code;
                return (
                  <TVTouchable
                    key={option.code}
                    onPress={() => setSelectedCurrency(option.code)}
                    style={{
                      borderRadius: 999,
                      backgroundColor: active ? '#8B5CF6' : 'rgba(255,255,255,0.07)',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText style={{ color: active ? '#FFFFFF' : 'rgba(247,242,255,0.55)', fontSize: 13, fontWeight: '600' }}>
                      {option.code}{option.symbol ? ` · ${option.symbol}` : ''}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </View>
          </Section>
        </FadeIn>
      ) : null}

      {activeQuickAmounts.length ? (
        <FadeIn delay={90}>
          <Section title="Select amount" subtitle="Choose the giving amount you want to review.">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {activeQuickAmounts.map((amount) => {
                const active = selectedAmount === amount;
                return (
                  <TVTouchable
                    key={`${selectedCurrency}-${amount}`}
                    onPress={() => setSelectedAmount(amount)}
                    style={{
                      width: isCompact ? '47%' : isTablet ? '23.5%' : '30.8%',
                      minHeight: 60,
                      borderRadius: 14,
                      backgroundColor: active ? '#8B5CF6' : 'rgba(255,255,255,0.07)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    }}
                    showFocusBorder={false}
                  >
                    <CustomText style={{ color: active ? '#FFFFFF' : '#F7F2FF', fontSize: 18, fontWeight: '700' }}>
                      {amount}
                    </CustomText>
                    <CustomText style={{ color: active ? 'rgba(255,255,255,0.75)' : 'rgba(247,242,255,0.40)', fontSize: 11 }}>
                      {selectedCurrency}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </View>
          </Section>
        </FadeIn>
      ) : null}

      <FadeIn delay={120}>
        <Section title="Giving rhythm">
          <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: 10 }}>
            {(['daily', 'weekly', 'monthly'] as DonateFrequency[]).map((frequency) => {
              const active = selectedFrequency === frequency;
              return (
                <TVTouchable
                  key={frequency}
                  onPress={() => setSelectedFrequency(frequency)}
                  style={{
                    flex: 1,
                    minHeight: 54,
                    borderRadius: 14,
                    backgroundColor: active ? '#8B5CF6' : 'rgba(255,255,255,0.07)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  showFocusBorder={false}
                >
                  <CustomText style={{ color: active ? '#FFFFFF' : 'rgba(247,242,255,0.55)', fontSize: 14, fontWeight: '600' }}>
                    {frequencyLabel(frequency)}
                  </CustomText>
                </TVTouchable>
              );
            })}
          </View>
        </Section>
      </FadeIn>

      {methods.length ? (
        <FadeIn delay={150}>
          <Section title="Preferred method">
            <View style={{ gap: 8 }}>
              {methods.map((method) => {
                const active = selectedMethod?.id === method.id;
                return (
                  <TVTouchable
                    key={method.id}
                    onPress={() => setSelectedMethodId(method.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      borderRadius: 14,
                      backgroundColor: active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.05)',
                      padding: 14,
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
                        backgroundColor: active ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <MaterialIcons name={method.icon} size={19} color={active ? '#A78BFA' : 'rgba(247,242,255,0.55)'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CustomText style={{ color: '#F7F2FF', fontSize: 14, fontWeight: '600' }}>
                        {method.label}
                      </CustomText>
                      <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 12, marginTop: 2 }}>
                        {method.subtitle}
                      </CustomText>
                    </View>
                    {method.badge ? (
                      <CustomText style={{ color: '#A78BFA', fontSize: 12, fontWeight: '600' }}>
                        {method.badge}
                      </CustomText>
                    ) : null}
                    {active ? (
                      <MaterialIcons name="check-circle" size={18} color="#8B5CF6" />
                    ) : null}
                  </TVTouchable>
                );
              })}
            </View>
          </Section>
        </FadeIn>
      ) : null}

      {impactBreakdown.length ? (
        <FadeIn delay={180}>
          <Section title="Ministry impact">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {impactBreakdown.slice(0, 4).map((impact) => (
                <View
                  key={impact.label}
                  style={{
                    width: isCompact ? '100%' : isTablet ? '23.5%' : '47%',
                    borderRadius: 14,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    padding: 16,
                    gap: 8,
                  }}
                >
                  <MaterialIcons name={impact.icon} size={18} color="#8B5CF6" />
                  <CustomText style={{ color: '#F7F2FF', fontSize: 20, fontWeight: '700' }}>
                    {impact.value}%
                  </CustomText>
                  <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 12 }}>
                    {impact.label}
                  </CustomText>
                </View>
              ))}
            </View>
          </Section>
        </FadeIn>
      ) : null}

      {selectedPlan ? (
        <FadeIn delay={210}>
          <View style={{ backgroundColor: '#110E1A', borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(139,92,246,0.15)',
                }}
              >
                <MaterialIcons name={selectedPlan.icon} size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <CustomText style={{ color: '#8B5CF6', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Giving summary
                </CustomText>
                <CustomText style={{ color: '#F7F2FF', fontSize: 15, fontWeight: '700', marginTop: 4 }} numberOfLines={1}>
                  {selectedPlan.name}
                </CustomText>
                <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 12, marginTop: 3 }} numberOfLines={2}>
                  {selectedPlan.note}
                </CustomText>
              </View>
            </View>
          </View>
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
          title="Need help?"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={contactGivingSupport}
          leftIcon={<MaterialIcons name="support-agent" size={18} color={theme.colors.text} />}
        />
      </View>
    </SettingsScaffold>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, ScrollView, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { CustomText } from '../../components/CustomText';
import { AppButton } from '../../components/ui/AppButton';
import { useAppTheme } from '../../util/colorScheme';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { APP_ROUTES } from '../../util/appRoutes';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Defaults (shown when admin config is not yet set) ────────────────────────

const DEFAULT_AMOUNTS = ['10', '25', '50', '100', '250', '500'];

const DEFAULT_METHODS: DonateMethod[] = [
  { id: 'bank',    icon: 'account-balance',   label: 'Bank Transfer',   subtitle: 'Direct to ministry account' },
  { id: 'mobile',  icon: 'phone-android',     label: 'Mobile Money',    subtitle: 'Fast & secure mobile transfer' },
  { id: 'card',    icon: 'credit-card',        label: 'Card Payment',    subtitle: 'Visa, Mastercard, Verve', badge: 'Secure' },
];

const IMPACT_ITEMS = [
  { icon: 'church'           as const, label: 'Ministry outreach', pct: 55 },
  { icon: 'people'           as const, label: 'Community programs', pct: 25 },
  { icon: 'movie'            as const, label: 'Media & content',   pct: 12 },
  { icon: 'build'            as const, label: 'Operations',        pct: 8  },
];

const SCRIPTURES = [
  '"Give, and it will be given to you." — Luke 6:38',
  '"Each of you should give what you have decided in your heart to give." — 2 Cor 9:7',
  '"Bring the whole tithe into the storehouse." — Malachi 3:10',
];

function frequencyLabel(v: DonateFrequency) {
  return v === 'daily' ? 'Daily' : v === 'weekly' ? 'Weekly' : 'Monthly';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroBanner({
  selectedAmount,
  selectedCurrency,
  selectedFrequency,
  selectedMethod,
  scripture,
}: {
  selectedAmount: string;
  selectedCurrency: string;
  selectedFrequency: DonateFrequency;
  selectedMethod: DonateMethod | null;
  scripture: string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View
        style={{
          backgroundColor: '#7C3AED',
          borderRadius: 28,
          padding: 22,
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <View style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' }} />

        {/* Icon + heading */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="volunteer-activism" size={26} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.9 }}>
              Support the ministry
            </CustomText>
            <CustomText style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 3, letterSpacing: -0.3 }}>
              Give with purpose
            </CustomText>
          </View>
        </View>

        {/* Summary pills */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[
            { icon: 'payments' as const,     label: selectedAmount ? `${selectedCurrency} ${selectedAmount}` : 'Select amount' },
            { icon: 'repeat' as const,       label: frequencyLabel(selectedFrequency) },
            { icon: 'credit-card' as const,  label: selectedMethod?.label ?? 'Payment method' },
          ].map((pill) => (
            <View
              key={pill.label}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(255,255,255,0.16)',
                borderRadius: 999,
                paddingHorizontal: 12, paddingVertical: 7,
                flex: 1, minWidth: 80,
              }}
            >
              <MaterialIcons name={pill.icon} size={13} color="rgba(255,255,255,0.85)" />
              <CustomText style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                {pill.label}
              </CustomText>
            </View>
          ))}
        </View>

        {/* Scripture */}
        <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' }}>
          <CustomText style={{ color: 'rgba(255,255,255,0.70)', fontSize: 12, fontStyle: 'italic', lineHeight: 18, textAlign: 'center' }}>
            {scripture}
          </CustomText>
        </View>
      </View>
    </Animated.View>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#110E1A',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.12)',
        padding: 18,
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <View style={{ gap: 3 }}>
        <CustomText style={{ color: '#F7F2FF', fontSize: 14, fontWeight: '700' }}>{title}</CustomText>
        {subtitle ? <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 12 }}>{subtitle}</CustomText> : null}
      </View>
      {children}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Donate() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { config } = useMobileAppConfig();

  const isCompact = width < 390;
  const isTablet  = width >= 768;
  const donateConfig = config?.donate;

  // Config-driven OR defaults
  const quickAmounts      = useMemo(() => donateConfig?.quickAmounts?.length ? donateConfig.quickAmounts : DEFAULT_AMOUNTS, [donateConfig]);
  const quickByCurrency   = useMemo(() => donateConfig?.quickAmountsByCurrency ?? {}, [donateConfig]);
  const currencyOptions   = useMemo(() => donateConfig?.currencyOptions ?? [], [donateConfig]);
  const configMethods     = useMemo<DonateMethod[]>(() =>
    donateConfig?.methods?.length
      ? donateConfig.methods.map((m) => ({ id: m.id, icon: m.icon as DonateMethod['icon'], label: m.label, subtitle: m.subtitle, badge: m.badge }))
      : DEFAULT_METHODS,
    [donateConfig],
  );
  const plans = useMemo<DonatePlan[]>(() =>
    (donateConfig?.plans ?? []).map((p) => ({ id: p.id, name: p.name, amount: p.amount, period: p.period, note: p.note, featured: p.featured, icon: p.icon as DonatePlan['icon'] })),
    [donateConfig],
  );
  const impactBreakdown = useMemo(() =>
    donateConfig?.impactBreakdown?.length
      ? donateConfig.impactBreakdown.map((i) => ({ icon: i.icon as React.ComponentProps<typeof MaterialIcons>['name'], label: i.label, pct: i.value }))
      : IMPACT_ITEMS,
    [donateConfig],
  );

  const defaultCurrency = (donateConfig?.currency ?? 'USD').toUpperCase();
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);
  const [selectedFrequency, setSelectedFrequency] = useState<DonateFrequency>('monthly');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');

  const activeAmounts = useMemo(() => quickByCurrency[selectedCurrency] ?? quickAmounts, [quickByCurrency, quickAmounts, selectedCurrency]);
  const selectedMethod = useMemo(() => configMethods.find((m) => m.id === selectedMethodId) ?? configMethods[0] ?? null, [configMethods, selectedMethodId]);
  const selectedPlan   = useMemo(() => plans.find((p) => p.period === selectedFrequency) ?? plans[0] ?? null, [plans, selectedFrequency]);

  const scriptureIndex = useMemo(() => Math.floor(Date.now() / 86400000) % SCRIPTURES.length, []);
  const scripture = SCRIPTURES[scriptureIndex] ?? SCRIPTURES[0]!;

  const supportEmail = config?.privacy?.contactEmail ?? 'support@claudygod.org';

  useEffect(() => { setSelectedCurrency(defaultCurrency); }, [defaultCurrency]);

  useEffect(() => {
    if (activeAmounts.length > 0 && !activeAmounts.includes(selectedAmount)) {
      setSelectedAmount(activeAmounts[0] ?? '');
    }
  }, [activeAmounts, selectedAmount]);

  useEffect(() => {
    if (configMethods.length > 0 && !configMethods.some((m) => m.id === selectedMethodId)) {
      setSelectedMethodId(configMethods[0]?.id ?? '');
    }
  }, [configMethods, selectedMethodId]);

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

  const contactSupport = () => {
    const subject = encodeURIComponent('Giving support request');
    const body = encodeURIComponent('Hello, I need help with giving on the ClaudyGod app.');
    void Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#07050C' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TVTouchable
          onPress={() => router.back()}
          showFocusBorder={false}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' }}
        >
          <MaterialIcons name="arrow-back" size={18} color="#F7F2FF" />
        </TVTouchable>
        <View style={{ flex: 1 }}>
          <CustomText style={{ color: '#F7F2FF', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>Giving</CustomText>
          <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 12, marginTop: 1 }}>Partner with the ministry</CustomText>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <HeroBanner
          selectedAmount={selectedAmount}
          selectedCurrency={selectedCurrency}
          selectedFrequency={selectedFrequency}
          selectedMethod={selectedMethod}
          scripture={scripture}
        />

        {/* Currency selector (only if multiple currencies configured) */}
        {currencyOptions.length > 1 ? (
          <SectionCard title="Currency">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {currencyOptions.map((opt) => {
                const active = selectedCurrency === opt.code;
                return (
                  <TVTouchable
                    key={opt.code}
                    onPress={() => setSelectedCurrency(opt.code)}
                    showFocusBorder={false}
                    style={{
                      borderRadius: 999,
                      backgroundColor: active ? '#8B5CF6' : 'rgba(255,255,255,0.07)',
                      paddingHorizontal: 14, paddingVertical: 9,
                    }}
                  >
                    <CustomText style={{ color: active ? '#FFFFFF' : 'rgba(247,242,255,0.55)', fontSize: 13, fontWeight: '600' }}>
                      {opt.code}{opt.symbol ? ` · ${opt.symbol}` : ''}
                    </CustomText>
                  </TVTouchable>
                );
              })}
            </View>
          </SectionCard>
        ) : null}

        {/* Amount selection */}
        <SectionCard title="Choose amount" subtitle={`Select how much you'd like to give (${selectedCurrency})`}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {activeAmounts.map((amount) => {
              const active = selectedAmount === amount;
              return (
                <TVTouchable
                  key={`${selectedCurrency}-${amount}`}
                  onPress={() => setSelectedAmount(amount)}
                  showFocusBorder={false}
                  style={{
                    width: isCompact ? '47%' : isTablet ? '15%' : '30%',
                    minHeight: 64,
                    borderRadius: 16,
                    backgroundColor: active ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                    borderWidth: 1,
                    borderColor: active ? 'transparent' : 'rgba(255,255,255,0.07)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    shadowColor: active ? '#8B5CF6' : 'transparent',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: active ? 0.45 : 0,
                    shadowRadius: 14,
                    elevation: active ? 8 : 0,
                  }}
                >
                  <CustomText style={{ color: active ? '#FFFFFF' : '#F7F2FF', fontSize: 20, fontWeight: '800' }}>
                    {amount}
                  </CustomText>
                  <CustomText style={{ color: active ? 'rgba(255,255,255,0.75)' : 'rgba(247,242,255,0.35)', fontSize: 10, fontWeight: '600' }}>
                    {selectedCurrency}
                  </CustomText>
                </TVTouchable>
              );
            })}
          </View>
        </SectionCard>

        {/* Giving frequency */}
        <SectionCard title="Giving rhythm" subtitle="How often would you like to give?">
          <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: 10 }}>
            {(['monthly', 'weekly', 'daily'] as DonateFrequency[]).map((freq) => {
              const active = selectedFrequency === freq;
              return (
                <TVTouchable
                  key={freq}
                  onPress={() => setSelectedFrequency(freq)}
                  showFocusBorder={false}
                  style={{
                    flex: 1, minHeight: 52,
                    borderRadius: 14,
                    backgroundColor: active ? '#8B5CF6' : 'rgba(255,255,255,0.06)',
                    borderWidth: 1,
                    borderColor: active ? 'transparent' : 'rgba(255,255,255,0.07)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    shadowColor: active ? '#8B5CF6' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: active ? 0.4 : 0,
                    shadowRadius: 10,
                    elevation: active ? 6 : 0,
                  }}
                >
                  <MaterialIcons
                    name={freq === 'monthly' ? 'event-repeat' : freq === 'weekly' ? 'date-range' : 'today'}
                    size={16}
                    color={active ? '#FFFFFF' : 'rgba(247,242,255,0.45)'}
                  />
                  <CustomText style={{ color: active ? '#FFFFFF' : 'rgba(247,242,255,0.60)', fontSize: 13, fontWeight: '700' }}>
                    {frequencyLabel(freq)}
                  </CustomText>
                </TVTouchable>
              );
            })}
          </View>
        </SectionCard>

        {/* Payment methods */}
        <SectionCard title="Payment method" subtitle="Choose how you'd like to give">
          <View style={{ gap: 8 }}>
            {configMethods.map((method) => {
              const active = selectedMethod?.id === method.id;
              return (
                <TVTouchable
                  key={method.id}
                  onPress={() => setSelectedMethodId(method.id)}
                  showFocusBorder={false}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    borderRadius: 14,
                    backgroundColor: active ? 'rgba(139,92,246,0.16)' : 'rgba(255,255,255,0.04)',
                    borderWidth: 1,
                    borderColor: active ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.07)',
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: active ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.07)',
                    }}
                  >
                    <MaterialIcons name={method.icon} size={20} color={active ? '#A78BFA' : 'rgba(247,242,255,0.50)'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText style={{ color: '#F7F2FF', fontSize: 14, fontWeight: '600' }}>{method.label}</CustomText>
                    <CustomText style={{ color: 'rgba(247,242,255,0.40)', fontSize: 12, marginTop: 2 }}>{method.subtitle}</CustomText>
                  </View>
                  {method.badge ? (
                    <View style={{ backgroundColor: 'rgba(139,92,246,0.20)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <CustomText style={{ color: '#A78BFA', fontSize: 10, fontWeight: '700' }}>{method.badge}</CustomText>
                    </View>
                  ) : null}
                  {active ? <MaterialIcons name="check-circle" size={18} color="#8B5CF6" /> : null}
                </TVTouchable>
              );
            })}
          </View>
        </SectionCard>

        {/* Ministry impact */}
        <SectionCard title="Your impact" subtitle="How every gift is used to advance the kingdom">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {impactBreakdown.slice(0, 4).map((item) => (
              <View
                key={item.label}
                style={{
                  width: isCompact ? '100%' : isTablet ? '23%' : '47%',
                  backgroundColor: 'rgba(139,92,246,0.07)',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(139,92,246,0.14)',
                  padding: 14,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name={item.icon} size={16} color="#8B5CF6" />
                  <CustomText style={{ color: '#8B5CF6', fontSize: 20, fontWeight: '800' }}>{item.pct}%</CustomText>
                </View>
                <CustomText style={{ color: 'rgba(247,242,255,0.45)', fontSize: 11, lineHeight: 16 }}>{item.label}</CustomText>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* CTA buttons */}
        <View style={{ gap: 10, paddingTop: 4 }}>
          <AppButton
            title={selectedAmount ? `Review giving · ${selectedCurrency} ${selectedAmount}/${frequencyLabel(selectedFrequency).toLowerCase()}` : 'Select an amount to continue'}
            size="lg"
            fullWidth
            disabled={!selectedAmount}
            onPress={continueToReview}
            leftIcon={<MaterialIcons name="lock-outline" size={18} color={theme.colors.textInverse} />}
          />
          <AppButton
            title="Need help giving?"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={contactSupport}
            leftIcon={<MaterialIcons name="support-agent" size={18} color={theme.colors.text} />}
          />
        </View>

        {/* Trust note */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingTop: 4 }}>
          <MaterialIcons name="verified-user" size={13} color="rgba(139,92,246,0.55)" />
          <CustomText style={{ color: 'rgba(247,242,255,0.30)', fontSize: 11, textAlign: 'center' }}>
            Secure giving • All transactions are encrypted
          </CustomText>
        </View>
      </ScrollView>
    </View>
  );
}

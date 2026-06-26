import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Modal, Platform, ScrollView, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { CustomText } from '../../components/CustomText';
import { AppButton } from '../../components/ui/AppButton';
import { useAppTheme } from '../../util/colorScheme';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';

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
  { id: 'bank',   icon: 'account-balance', label: 'Bank Transfer',  subtitle: 'Direct to ministry account' },
  { id: 'mobile', icon: 'phone-android',   label: 'Mobile Money',   subtitle: 'Fast & secure mobile transfer' },
  { id: 'card',   icon: 'credit-card',     label: 'Card Payment',   subtitle: 'Visa, Mastercard, Verve', badge: 'Secure' },
];

const IMPACT_ITEMS = [
  { icon: 'church'  as const, label: 'Ministry outreach', pct: 55 },
  { icon: 'people'  as const, label: 'Community programs', pct: 25 },
  { icon: 'movie'   as const, label: 'Media & content',   pct: 12 },
  { icon: 'build'   as const, label: 'Operations',        pct: 8  },
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
  const theme = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View
        style={{
          backgroundColor: theme.colors.accent,
          borderRadius: 28,
          padding: 22,
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles — on-primary overlays, always white-tinted */}
        <View style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' }} />

        {/* Icon + heading */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="volunteer-activism" size={26} color={theme.colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <CustomText style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.9 }}>
              Support the ministry
            </CustomText>
            <CustomText style={{ color: theme.colors.onPrimary, fontSize: 18, fontWeight: '800', marginTop: 3, letterSpacing: -0.3 }}>
              Give with purpose
            </CustomText>
          </View>
        </View>

        {/* Summary pills */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[
            { icon: 'payments'    as const, label: selectedAmount ? `${selectedCurrency} ${selectedAmount}` : 'Select amount' },
            { icon: 'repeat'      as const, label: frequencyLabel(selectedFrequency) },
            { icon: 'credit-card' as const, label: selectedMethod?.label ?? 'Payment method' },
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
              <CustomText style={{ color: theme.colors.onPrimary, fontSize: 11, fontWeight: '600', flex: 1 }} numberOfLines={1}>
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
  const theme = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.primaryBorder,
        padding: 18,
        gap: 14,
      }}
    >
      <View style={{ gap: 3 }}>
        <CustomText style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }}>{title}</CustomText>
        {subtitle ? <CustomText style={{ color: theme.colors.textMuted, fontSize: 12 }}>{subtitle}</CustomText> : null}
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

  const quickAmounts    = useMemo(() => donateConfig?.quickAmounts?.length ? donateConfig.quickAmounts : DEFAULT_AMOUNTS, [donateConfig]);
  const quickByCurrency = useMemo(() => donateConfig?.quickAmountsByCurrency ?? {}, [donateConfig]);
  const currencyOptions = useMemo(() => donateConfig?.currencyOptions ?? [], [donateConfig]);
  const configMethods   = useMemo<DonateMethod[]>(() =>
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
  const [selectedCurrency, setSelectedCurrency]   = useState(defaultCurrency);
  const [selectedFrequency, setSelectedFrequency] = useState<DonateFrequency>('monthly');
  const [selectedAmount, setSelectedAmount]       = useState('');
  const [selectedMethodId, setSelectedMethodId]   = useState('');

  const activeAmounts  = useMemo(() => quickByCurrency[selectedCurrency] ?? quickAmounts, [quickByCurrency, quickAmounts, selectedCurrency]);
  const selectedMethod = useMemo(() => configMethods.find((m) => m.id === selectedMethodId) ?? configMethods[0] ?? null, [configMethods, selectedMethodId]);
  const selectedPlan   = useMemo(() => plans.find((p) => p.period === selectedFrequency) ?? plans[0] ?? null, [plans, selectedFrequency]);

  const scriptureIndex = useMemo(() => Math.floor(Date.now() / 86400000) % SCRIPTURES.length, []);
  const scripture = SCRIPTURES[scriptureIndex] ?? SCRIPTURES[0]!;

  const supportEmail = config?.privacy?.contactEmail ?? 'support@claudygod.org';
  const [showComingSoon, setShowComingSoon] = useState(false);

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
    setShowComingSoon(true);
  };

  const contactSupport = () => {
    const subject = encodeURIComponent('Giving support request');
    const body = encodeURIComponent('Hello, I need help with giving on the ClaudyGod app.');
    void Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>

      {/* Coming soon modal */}
      <Modal
        visible={showComingSoon}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoon(false)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setShowComingSoon(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: 28,
                  alignItems: 'center',
                  gap: 14,
                  maxWidth: 340,
                  width: '100%',
                }}
              >
                <View
                  style={{
                    width: 68, height: 68, borderRadius: 34,
                    backgroundColor: theme.colors.primarySurface,
                    borderWidth: 1, borderColor: theme.colors.primaryBorder,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="volunteer-activism" size={32} color={theme.colors.primary} />
                </View>
                <CustomText style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 }}>
                  Coming soon
                </CustomText>
                <CustomText style={{ color: theme.colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
                  Online giving is being set up for launch. In the meantime, you can reach us directly to give.
                </CustomText>
                <AppButton
                  title="Contact us to give"
                  size="md"
                  fullWidth
                  onPress={() => {
                    setShowComingSoon(false);
                    contactSupport();
                  }}
                  leftIcon={<MaterialIcons name="support-agent" size={17} color="#FFFFFF" />}
                />
                <TVTouchable
                  onPress={() => setShowComingSoon(false)}
                  showFocusBorder={false}
                  style={{ paddingVertical: 6 }}
                >
                  <CustomText style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '500' }}>
                    Close
                  </CustomText>
                </TVTouchable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface }}
        >
          <MaterialIcons name="arrow-back" size={18} color={theme.colors.text} />
        </TVTouchable>
        <View style={{ flex: 1 }}>
          <CustomText style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>Giving</CustomText>
          <CustomText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 1 }}>Partner with the ministry</CustomText>
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
                      backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                      paddingHorizontal: 14, paddingVertical: 9,
                    }}
                  >
                    <CustomText style={{ color: active ? theme.colors.onPrimary : theme.colors.textMuted, fontSize: 13, fontWeight: '600' }}>
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
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: active ? 'transparent' : theme.colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <CustomText style={{ color: active ? theme.colors.onPrimary : theme.colors.text, fontSize: 20, fontWeight: '800' }}>
                    {amount}
                  </CustomText>
                  <CustomText style={{ color: active ? 'rgba(255,255,255,0.75)' : theme.colors.textMuted, fontSize: 10, fontWeight: '600' }}>
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
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: active ? 'transparent' : theme.colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                  }}
                >
                  <MaterialIcons
                    name={freq === 'monthly' ? 'event-repeat' : freq === 'weekly' ? 'date-range' : 'today'}
                    size={16}
                    color={active ? theme.colors.onPrimary : theme.colors.textMuted}
                  />
                  <CustomText style={{ color: active ? theme.colors.onPrimary : theme.colors.textSecondary, fontSize: 13, fontWeight: '700' }}>
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
                    backgroundColor: active ? theme.colors.primarySurface : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primaryBorder : theme.colors.border,
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: active ? theme.colors.primarySurface : theme.colors.surfaceAlt,
                    }}
                  >
                    <MaterialIcons name={method.icon} size={20} color={active ? theme.colors.secondary : theme.colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600' }}>{method.label}</CustomText>
                    <CustomText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{method.subtitle}</CustomText>
                  </View>
                  {method.badge ? (
                    <View style={{ backgroundColor: theme.colors.primarySurface, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <CustomText style={{ color: theme.colors.secondary, fontSize: 10, fontWeight: '700' }}>{method.badge}</CustomText>
                    </View>
                  ) : null}
                  {active ? <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} /> : null}
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
                  backgroundColor: theme.colors.primarySurface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.colors.primaryBorder,
                  padding: 14,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name={item.icon} size={16} color={theme.colors.primary} />
                  <CustomText style={{ color: theme.colors.primary, fontSize: 20, fontWeight: '800' }}>{item.pct}%</CustomText>
                </View>
                <CustomText style={{ color: theme.colors.textMuted, fontSize: 11, lineHeight: 16 }}>{item.label}</CustomText>
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
          <MaterialIcons name="verified-user" size={13} color={theme.colors.textMuted} />
          <CustomText style={{ color: theme.colors.textMuted, fontSize: 11, textAlign: 'center' }}>
            Secure giving • All transactions are encrypted
          </CustomText>
        </View>
      </ScrollView>
    </View>
  );
}

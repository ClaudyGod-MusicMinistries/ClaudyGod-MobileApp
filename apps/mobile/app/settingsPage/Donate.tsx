import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Modal, Platform, ScrollView, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { CustomText } from '../../components/CustomText';
import { AppButton } from '../../components/ui/AppButton';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
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

// ─── Defaults ────────────────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  root:             { flex: 1, backgroundColor: theme.colors.background },

  // Header
  header:           { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBack:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
  headerWrap:       { flex: 1 },
  headerTitle:      { color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  headerSub:        { color: theme.colors.textMuted, fontSize: 12, marginTop: 1 },

  // Hero
  heroBg:           { backgroundColor: theme.colors.accent, borderRadius: 28, padding: 22, overflow: 'hidden' },
  heroCircle1:      { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroCircle2:      { position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroIconRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  heroIconCircle:   { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroTitleWrap:    { flex: 1 },
  heroLabel:        { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.9 },
  heroTitle:        { color: theme.colors.onPrimary, fontSize: 18, fontWeight: '800', marginTop: 3, letterSpacing: -0.3 },
  pillRow:          { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill:             { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, flex: 1, minWidth: 80 },
  pillText:         { color: theme.colors.onPrimary, fontSize: 11, fontWeight: '600', flex: 1 },
  scriptureWrap:    { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  scriptureText:    { color: 'rgba(255,255,255,0.70)', fontSize: 12, fontStyle: 'italic', lineHeight: 18, textAlign: 'center' },

  // SectionCard
  card:             { backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.primaryBorder, padding: 18, gap: 14 },
  cardHeader:       { gap: 3 },
  cardTitle:        { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  cardSubtitle:     { color: theme.colors.textMuted, fontSize: 12 },

  // Currency
  currencyRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyBase:     { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  currencyActive:   { backgroundColor: theme.colors.primary },
  currencyInactive: { backgroundColor: theme.colors.surface },
  currencyTxtActive:   { color: theme.colors.onPrimary, fontSize: 13, fontWeight: '600' },
  currencyTxtInactive: { color: theme.colors.textMuted,   fontSize: 13, fontWeight: '600' },

  // Amount
  amountGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amountBase:       { minHeight: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 2 },
  amountActive:     { backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: 'transparent' },
  amountInactive:   { backgroundColor: theme.colors.surface,  borderWidth: 1, borderColor: theme.colors.border },
  amountValActive:  { color: theme.colors.onPrimary,          fontSize: 20, fontWeight: '800' },
  amountValInactive:{ color: theme.colors.text,               fontSize: 20, fontWeight: '800' },
  amountCurActive:  { color: 'rgba(255,255,255,0.75)',         fontSize: 10, fontWeight: '600' },
  amountCurInactive:{ color: theme.colors.textMuted,           fontSize: 10, fontWeight: '600' },

  // Frequency
  freqBase:         { flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 3 },
  freqActive:       { backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: 'transparent' },
  freqInactive:     { backgroundColor: theme.colors.surface,  borderWidth: 1, borderColor: theme.colors.border },
  freqTxtActive:    { color: theme.colors.onPrimary,    fontSize: 13, fontWeight: '700' },
  freqTxtInactive:  { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' },

  // Payment methods
  methodsList:      { gap: 8 },
  methodBase:       { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, borderWidth: 1, padding: 14 },
  methodActive:     { backgroundColor: theme.colors.primarySurface, borderColor: theme.colors.primaryBorder },
  methodInactive:   { backgroundColor: theme.colors.surface,         borderColor: theme.colors.border },
  methodIconBase:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  methodIconActive: { backgroundColor: theme.colors.primarySurface },
  methodIconInactive:{ backgroundColor: theme.colors.surfaceAlt },
  methodWrap:       { flex: 1 },
  methodLabel:      { color: theme.colors.text,    fontSize: 14, fontWeight: '600' },
  methodSub:        { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  methodBadge:      { backgroundColor: theme.colors.primarySurface, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  methodBadgeText:  { color: theme.colors.secondary, fontSize: 10, fontWeight: '700' },

  // Impact
  impactGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  impactCard:       { backgroundColor: theme.colors.primarySurface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.primaryBorder, padding: 14, gap: 8 },
  impactRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  impactPct:        { color: theme.colors.primary, fontSize: 20, fontWeight: '800' },
  impactLabel:      { color: theme.colors.textMuted, fontSize: 11, lineHeight: 16 },

  // CTA
  ctaWrap:          { gap: 10, paddingTop: 4 },
  trustRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingTop: 4 },
  trustText:        { color: theme.colors.textMuted, fontSize: 11, textAlign: 'center' },
  flex1:            { flex: 1 },
  scrollContent:    { paddingHorizontal: 16, gap: 16 },

  // Coming-soon modal
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard:        { backgroundColor: theme.colors.surface, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border, padding: 28, alignItems: 'center', gap: 14, maxWidth: 340, width: '100%' },
  modalIcon:        { width: 68, height: 68, borderRadius: 34, backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  modalTitle:       { color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  modalSubtitle:    { color: theme.colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  modalClose:       { paddingVertical: 6 },
  modalCloseText:   { color: theme.colors.textMuted, fontSize: 13, fontWeight: '500' },
}));

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
  const styles = useStyles();
  const theme  = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [fadeAnim]);

  const pills = [
    { icon: 'payments'    as const, label: selectedAmount ? `${selectedCurrency} ${selectedAmount}` : 'Select amount' },
    { icon: 'repeat'      as const, label: frequencyLabel(selectedFrequency) },
    { icon: 'credit-card' as const, label: selectedMethod?.label ?? 'Payment method' },
  ];

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.heroBg}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <View style={styles.heroIconRow}>
          <View style={styles.heroIconCircle}>
            <MaterialIcons name="volunteer-activism" size={26} color={theme.colors.onPrimary} />
          </View>
          <View style={styles.heroTitleWrap}>
            <CustomText style={styles.heroLabel}>Support the ministry</CustomText>
            <CustomText style={styles.heroTitle}>Give with purpose</CustomText>
          </View>
        </View>

        <View style={styles.pillRow}>
          {pills.map((pill) => (
            <View key={pill.label} style={styles.pill}>
              <MaterialIcons name={pill.icon} size={13} color="rgba(255,255,255,0.85)" />
              <CustomText style={styles.pillText} numberOfLines={1}>{pill.label}</CustomText>
            </View>
          ))}
        </View>

        <View style={styles.scriptureWrap}>
          <CustomText style={styles.scriptureText}>{scripture}</CustomText>
        </View>
      </View>
    </Animated.View>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <CustomText style={styles.cardTitle}>{title}</CustomText>
        {subtitle ? <CustomText style={styles.cardSubtitle}>{subtitle}</CustomText> : null}
      </View>
      {children}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Donate() {
  const styles = useStyles();
  const theme  = useAppTheme();
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
  const impactBreakdown = useMemo(() =>
    donateConfig?.impactBreakdown?.length
      ? donateConfig.impactBreakdown.map((i) => ({ icon: i.icon as React.ComponentProps<typeof MaterialIcons>['name'], label: i.label, pct: i.value }))
      : IMPACT_ITEMS,
    [donateConfig],
  );

  const defaultCurrency = (donateConfig?.currency ?? 'USD').toUpperCase();
  const [selectedCurrency,  setSelectedCurrency]  = useState(defaultCurrency);
  const [selectedFrequency, setSelectedFrequency] = useState<DonateFrequency>('monthly');
  const [selectedAmount,    setSelectedAmount]    = useState('');
  const [selectedMethodId,  setSelectedMethodId]  = useState('');

  const activeAmounts  = useMemo(() => quickByCurrency[selectedCurrency] ?? quickAmounts, [quickByCurrency, quickAmounts, selectedCurrency]);
  const selectedMethod = useMemo(() => configMethods.find((m) => m.id === selectedMethodId) ?? configMethods[0] ?? null, [configMethods, selectedMethodId]);

  const scriptureIndex = useMemo(() => Math.floor(Date.now() / 86400000) % SCRIPTURES.length, []);
  const scripture      = SCRIPTURES[scriptureIndex] ?? SCRIPTURES[0]!;

  const supportEmail   = config?.privacy?.contactEmail ?? 'support@claudygod.org';
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
    const body    = encodeURIComponent('Hello, I need help with giving on the ClaudyGod app.');
    void Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  const amountWidth = isCompact ? '47%' : isTablet ? '15%' : '30%';
  const impactWidth = isCompact ? '100%' : isTablet ? '23%' : '47%';

  return (
    <View style={styles.root}>
      {/* Coming soon modal */}
      <Modal
        visible={showComingSoon}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoon(false)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setShowComingSoon(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <View style={styles.modalIcon}>
                  <MaterialIcons name="volunteer-activism" size={32} color={theme.colors.primary} />
                </View>
                <CustomText style={styles.modalTitle}>Coming soon</CustomText>
                <CustomText style={styles.modalSubtitle}>
                  Online giving is being set up for launch. In the meantime, you can reach us directly to give.
                </CustomText>
                <AppButton
                  title="Contact us to give"
                  size="md"
                  fullWidth
                  onPress={() => { setShowComingSoon(false); contactSupport(); }}
                  leftIcon={<MaterialIcons name="support-agent" size={17} color="#FFFFFF" />}
                />
                <TVTouchable onPress={() => setShowComingSoon(false)} showFocusBorder={false} style={styles.modalClose}>
                  <CustomText style={styles.modalCloseText}>Close</CustomText>
                </TVTouchable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TVTouchable onPress={() => router.back()} showFocusBorder={false} style={styles.headerBack}>
          <MaterialIcons name="arrow-back" size={18} color={theme.colors.text} />
        </TVTouchable>
        <View style={styles.headerWrap}>
          <CustomText style={styles.headerTitle}>Giving</CustomText>
          <CustomText style={styles.headerSub}>Partner with the ministry</CustomText>
        </View>
      </View>

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <HeroBanner
          selectedAmount={selectedAmount}
          selectedCurrency={selectedCurrency}
          selectedFrequency={selectedFrequency}
          selectedMethod={selectedMethod}
          scripture={scripture}
        />

        {/* Currency selector */}
        {currencyOptions.length > 1 ? (
          <SectionCard title="Currency">
            <View style={styles.currencyRow}>
              {currencyOptions.map((opt) => {
                const active = selectedCurrency === opt.code;
                return (
                  <TVTouchable
                    key={opt.code}
                    onPress={() => setSelectedCurrency(opt.code)}
                    showFocusBorder={false}
                    style={[styles.currencyBase, active ? styles.currencyActive : styles.currencyInactive]}
                  >
                    <CustomText style={active ? styles.currencyTxtActive : styles.currencyTxtInactive}>
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
          <View style={styles.amountGrid}>
            {activeAmounts.map((amount) => {
              const active = selectedAmount === amount;
              return (
                <TVTouchable
                  key={`${selectedCurrency}-${amount}`}
                  onPress={() => setSelectedAmount(amount)}
                  showFocusBorder={false}
                  style={[styles.amountBase, active ? styles.amountActive : styles.amountInactive, { width: amountWidth }]}
                >
                  <CustomText style={active ? styles.amountValActive : styles.amountValInactive}>
                    {amount}
                  </CustomText>
                  <CustomText style={active ? styles.amountCurActive : styles.amountCurInactive}>
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
                  style={[styles.freqBase, active ? styles.freqActive : styles.freqInactive]}
                >
                  <MaterialIcons
                    name={freq === 'monthly' ? 'event-repeat' : freq === 'weekly' ? 'date-range' : 'today'}
                    size={16}
                    color={active ? theme.colors.onPrimary : theme.colors.textMuted}
                  />
                  <CustomText style={active ? styles.freqTxtActive : styles.freqTxtInactive}>
                    {frequencyLabel(freq)}
                  </CustomText>
                </TVTouchable>
              );
            })}
          </View>
        </SectionCard>

        {/* Payment methods */}
        <SectionCard title="Payment method" subtitle="Choose how you'd like to give">
          <View style={styles.methodsList}>
            {configMethods.map((method) => {
              const active = selectedMethod?.id === method.id;
              return (
                <TVTouchable
                  key={method.id}
                  onPress={() => setSelectedMethodId(method.id)}
                  showFocusBorder={false}
                  style={[styles.methodBase, active ? styles.methodActive : styles.methodInactive]}
                >
                  <View style={[styles.methodIconBase, active ? styles.methodIconActive : styles.methodIconInactive]}>
                    <MaterialIcons name={method.icon} size={20} color={active ? theme.colors.secondary : theme.colors.textMuted} />
                  </View>
                  <View style={styles.methodWrap}>
                    <CustomText style={styles.methodLabel}>{method.label}</CustomText>
                    <CustomText style={styles.methodSub}>{method.subtitle}</CustomText>
                  </View>
                  {method.badge ? (
                    <View style={styles.methodBadge}>
                      <CustomText style={styles.methodBadgeText}>{method.badge}</CustomText>
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
          <View style={styles.impactGrid}>
            {impactBreakdown.slice(0, 4).map((item) => (
              <View key={item.label} style={[styles.impactCard, { width: impactWidth }]}>
                <View style={styles.impactRow}>
                  <MaterialIcons name={item.icon} size={16} color={theme.colors.primary} />
                  <CustomText style={styles.impactPct}>{item.pct}%</CustomText>
                </View>
                <CustomText style={styles.impactLabel}>{item.label}</CustomText>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* CTA */}
        <View style={styles.ctaWrap}>
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

        <View style={styles.trustRow}>
          <MaterialIcons name="verified-user" size={13} color={theme.colors.textMuted} />
          <CustomText style={styles.trustText}>Secure giving • All transactions are encrypted</CustomText>
        </View>
      </ScrollView>
    </View>
  );
}

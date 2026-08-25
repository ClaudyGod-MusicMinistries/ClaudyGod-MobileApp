import React, { useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PremiumPage } from '../../components/feed';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AppButton } from '../../components/ui/AppButton';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createPublicDonationIntent } from '../../services/userFlowService';
import { useToast } from '../../context/ToastContext';
import { openExternalUrl } from '../../util/externalLinks';

type Frequency = 'once' | 'weekly' | 'monthly';
type Method = { id: string; label: string; subtitle: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] };
type CreatedIntent = { id: string; status: string; title: string; message: string; actionLabel?: string; actionUrl?: string };

const FALLBACK_CURRENCIES = [{ code: 'USD', label: 'US Dollar', symbol: '$' }, { code: 'NGN', label: 'Nigerian Naira', symbol: '₦' }];
const FALLBACK_AMOUNTS: Record<string, string[]> = { USD: ['10', '25', '50', '100'], NGN: ['1000', '2500', '5000', '10000'] };
const FALLBACK_METHODS: Method[] = [{ id: 'bank', label: 'Bank transfer', subtitle: 'Receive the ministry’s approved bank instructions', icon: 'account-balance' }];

const useStyles = makeStyles((theme) => ({
  intro: { padding: theme.spacing.xl, gap: 10 },
  eyebrow: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  introBody: { color: theme.colors.textSecondary, lineHeight: 22 },
  steps: { flexDirection: 'row', gap: 8, marginTop: 4 },
  step: { flex: 1, height: 3, borderRadius: 3, backgroundColor: theme.colors.border },
  stepActive: { backgroundColor: theme.colors.primary },
  card: { padding: theme.spacing.lg, gap: 14 },
  title: { color: theme.colors.text },
  description: { color: theme.colors.textSecondary, lineHeight: 20 },
  fieldLabel: { color: theme.colors.text, fontWeight: '700' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  currencyOption: { minWidth: 132, flexGrow: 1, flexBasis: 132, minHeight: 68, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.controlBorder, backgroundColor: theme.colors.controlSurface, flexDirection: 'row', alignItems: 'center', gap: 11 },
  currencyOptionActive: { borderColor: theme.colors.controlSelectedBorder, backgroundColor: theme.colors.controlSelectedSurface },
  currencySymbol: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceAlt },
  currencySymbolActive: { backgroundColor: theme.colors.controlSelectedIconSurface },
  currencySymbolText: { color: theme.colors.text, fontWeight: '800' },
  currencySymbolTextActive: { color: theme.colors.controlSelectedText },
  currencyCopy: { flex: 1 },
  currencyCode: { color: theme.colors.controlText, fontWeight: '800', letterSpacing: 0.5 },
  currencyCodeActive: { color: theme.colors.controlSelectedText },
  currencyName: { color: theme.colors.textMuted, marginTop: 2 },
  currencyNameActive: { color: theme.colors.controlSelectedText },
  chip: { minHeight: 44, paddingHorizontal: 15, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.controlBorder, justifyContent: 'center', backgroundColor: theme.colors.controlSurface },
  chipActive: { borderColor: theme.colors.controlSelectedBorder, backgroundColor: theme.colors.controlSelectedSurface },
  chipText: { color: theme.colors.controlText, fontWeight: '600' },
  chipTextActive: { color: theme.colors.controlSelectedText },
  amountField: { minHeight: 72, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.controlBorder, backgroundColor: theme.colors.controlSurface, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  amountPrefix: { alignSelf: 'stretch', minWidth: 76, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceAlt, borderRightWidth: 1, borderRightColor: theme.colors.controlBorder },
  amountSymbol: { color: theme.colors.text, fontWeight: '800' },
  amountCode: { color: theme.colors.textMuted, marginTop: 2, letterSpacing: 0.6 },
  input: { flex: 1, minHeight: 70, color: theme.colors.text, paddingHorizontal: 16, fontSize: 24, fontWeight: '700' },
  quickHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  quickHint: { color: theme.colors.textMuted },
  error: { color: theme.colors.danger },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.controlBorder, borderRadius: 16, backgroundColor: theme.colors.controlSurface },
  methodActive: { borderColor: theme.colors.controlSelectedBorder, backgroundColor: theme.colors.controlSelectedSurface },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceAlt },
  methodCopy: { flex: 1 },
  methodTitle: { color: theme.colors.controlText },
  methodTitleActive: { color: theme.colors.controlSelectedText },
  methodDescriptionActive: { color: theme.colors.controlSelectedText },
  methodIconActive: { backgroundColor: theme.colors.controlSelectedIconSurface },
  review: { padding: theme.spacing.lg, gap: 12 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  reviewLabel: { color: theme.colors.textMuted },
  reviewValue: { color: theme.colors.text, flex: 1, textAlign: 'right', fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingTop: 4 },
  noticeText: { color: theme.colors.textSecondary, flex: 1, lineHeight: 19 },
}));

export default function Donate() {
  const styles = useStyles(); const theme = useAppTheme();
  const { config, loading: configLoading } = useMobileAppConfig();
  const { showToast } = useToast();
  const donate = config?.donate;
  const currencies = donate?.currencyOptions?.length ? donate.currencyOptions : FALLBACK_CURRENCIES;
  const methods = useMemo<Method[]>(() => donate?.methods?.length ? donate.methods.map((method) => ({ ...method, icon: method.icon as Method['icon'] })) : FALLBACK_METHODS, [donate]);
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('once');
  const [methodId, setMethodId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [intent, setIntent] = useState<CreatedIntent | null>(null);
  const quickAmounts = donate?.quickAmountsByCurrency?.[currency] ?? FALLBACK_AMOUNTS[currency] ?? donate?.quickAmounts ?? [];
  const selectedCurrency = currencies.find((item) => item.code === currency) ?? currencies[0];
  const method = methods.find((item) => item.id === methodId) ?? null;
  const normalizedAmount = amount.trim().replace(',', '.');
  const amountValid = /^\d+(\.\d{1,2})?$/.test(normalizedAmount) && Number(normalizedAmount) > 0;

  useEffect(() => { const configured = (donate?.currency ?? currencies[0]?.code ?? 'USD').toUpperCase(); setCurrency(configured); }, [currencies, donate?.currency]);
  useEffect(() => { if (!methods.some((item) => item.id === methodId)) setMethodId(methods[0]?.id ?? ''); }, [methods, methodId]);

  const submit = async () => {
    if (!amountValid || !method || submitting) return;
    setSubmitting(true);
    try {
      const response = await createPublicDonationIntent({ amount: normalizedAmount, currency, mode: frequency, methodId: method.id, metadata: { source: 'mobile_giving_v2' } });
      const created = response.donationIntent;
      setIntent({ id: created.id, status: created.status, title: created.instructions?.title ?? 'Giving request ready', message: created.instructions?.message ?? 'Your request was recorded. Contact the giving team for the approved next step.', actionLabel: created.instructions?.actionLabel, actionUrl: created.instructions?.actionUrl });
    } catch (error) {
      showToast({ title: 'Giving request not created', message: error instanceof Error ? error.message : 'Please try again.', tone: 'error' });
    } finally { setSubmitting(false); }
  };

  return <>
    <ConfirmModal visible={Boolean(intent)} brandMark icon="volunteer-activism" title={intent?.title ?? 'Giving request'} body={`${intent?.message ?? ''}${intent ? `\n\nReference: ${intent.id.slice(0, 8)} · Status: ${intent.status}` : ''}`} primaryLabel={intent?.actionLabel ?? 'Done'} onPrimary={() => { const url = intent?.actionUrl; setIntent(null); if (url) void openExternalUrl(url); }} onDismiss={() => setIntent(null)} />
    <PremiumPage title="Giving" eyebrow="Support the ministry" subtitle="A clear, verified path from request to completion">
      <SurfaceCard tone="strong" style={styles.intro}>
        <CustomText variant="caption" style={styles.eyebrow}>Secure giving request</CustomText>
        <CustomText variant="display">Give with clarity.</CustomText>
        <CustomText variant="body" style={styles.introBody}>Choose your amount and preferred route. The server validates the request and returns the currently approved completion instructions.</CustomText>
        <View style={styles.steps}>{[true, amountValid, Boolean(method)].map((active, index) => <View key={index} style={[styles.step, active && styles.stepActive]} />)}</View>
      </SurfaceCard>

      <SurfaceCard tone="subtle" style={styles.card}>
        <CustomText variant="heading" style={styles.title}>1. Amount</CustomText>
        <CustomText variant="body" style={styles.description}>Choose the currency first, then enter the exact amount you intend to give.</CustomText>

        <CustomText variant="label" style={styles.fieldLabel}>Currency</CustomText>
        <View style={styles.currencyGrid}>{currencies.map((item) => { const selected = currency === item.code; return <TVTouchable key={item.code} accessibilityRole="radio" accessibilityLabel={`${item.label}, ${item.code}`} accessibilityState={{ selected }} onPress={() => { setCurrency(item.code); setAmount(''); }} showFocusBorder={false} style={[styles.currencyOption, selected && styles.currencyOptionActive]}><View style={[styles.currencySymbol, selected && styles.currencySymbolActive]}><CustomText style={[styles.currencySymbolText, selected && styles.currencySymbolTextActive]}>{item.symbol ?? item.code.slice(0, 1)}</CustomText></View><View style={styles.currencyCopy}><CustomText variant="label" style={[styles.currencyCode, selected && styles.currencyCodeActive]}>{item.code}</CustomText><CustomText variant="caption" style={[styles.currencyName, selected && styles.currencyNameActive]} numberOfLines={1}>{item.label}</CustomText></View>{selected ? <MaterialIcons name="check-circle" size={19} color={theme.colors.controlSelectedText} /> : null}</TVTouchable>; })}</View>

        <CustomText variant="label" style={styles.fieldLabel}>Amount</CustomText>
        <View style={styles.amountField}>
          <View style={styles.amountPrefix}><CustomText variant="heading" style={styles.amountSymbol}>{selectedCurrency?.symbol ?? currency}</CustomText><CustomText variant="caption" style={styles.amountCode}>{currency}</CustomText></View>
          <TextInput accessibilityLabel={`Giving amount in ${currency}`} value={amount} onChangeText={(value) => setAmount(value.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={theme.colors.textMuted} selectionColor={theme.colors.primary} cursorColor={theme.colors.primary} style={styles.input} />
        </View>
        {amount.length > 0 && !amountValid ? <CustomText variant="caption" style={styles.error}>Enter a positive amount with no more than two decimal places.</CustomText> : null}

        {quickAmounts.length ? <><View style={styles.quickHeader}><CustomText variant="label" style={styles.fieldLabel}>Quick amounts</CustomText><CustomText variant="caption" style={styles.quickHint}>Optional</CustomText></View><View style={styles.wrap}>{quickAmounts.map((value) => <TVTouchable key={value} accessibilityLabel={`${currency} ${value}`} onPress={() => setAmount(value)} showFocusBorder={false} style={[styles.chip, amount === value && styles.chipActive]}><CustomText style={[styles.chipText, amount === value && styles.chipTextActive]}>{selectedCurrency?.symbol ?? ''}{value}</CustomText></TVTouchable>)}</View></> : null}
      </SurfaceCard>

      <SurfaceCard tone="subtle" style={styles.card}>
        <CustomText variant="heading" style={styles.title}>2. Giving schedule</CustomText>
        <View style={styles.wrap}>{(['once', 'monthly', 'weekly'] as Frequency[]).map((value) => <TVTouchable key={value} accessibilityRole="radio" accessibilityState={{ selected: frequency === value }} onPress={() => setFrequency(value)} showFocusBorder={false} style={[styles.chip, frequency === value && styles.chipActive]}><CustomText style={[styles.chipText, frequency === value && styles.chipTextActive]}>{value === 'once' ? 'One time' : value[0]!.toUpperCase() + value.slice(1)}</CustomText></TVTouchable>)}</View>
      </SurfaceCard>

      <SurfaceCard tone="subtle" style={styles.card}>
        <CustomText variant="heading" style={styles.title}>3. Completion route</CustomText>
        <CustomText variant="body" style={styles.description}>These options come from the current mobile configuration. Final instructions are returned only after backend validation.</CustomText>
        {methods.map((item) => { const selected = methodId === item.id; return <TVTouchable key={item.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setMethodId(item.id)} showFocusBorder={false} style={[styles.method, selected && styles.methodActive]}><View style={[styles.icon, selected && styles.methodIconActive]}><MaterialIcons name={item.icon} size={20} color={selected ? theme.colors.controlSelectedText : theme.colors.primary} /></View><View style={styles.methodCopy}><CustomText variant="label" style={[styles.methodTitle, selected && styles.methodTitleActive]}>{item.label}</CustomText><CustomText variant="caption" style={[styles.description, selected && styles.methodDescriptionActive]}>{item.subtitle}</CustomText></View>{selected ? <MaterialIcons name="check-circle" size={20} color={theme.colors.controlSelectedText} /> : null}</TVTouchable>; })}
      </SurfaceCard>

      <SurfaceCard tone="strong" style={styles.review}>
        <CustomText variant="heading">Review request</CustomText>
        <View style={styles.reviewRow}><CustomText style={styles.reviewLabel}>Amount</CustomText><CustomText style={styles.reviewValue}>{amountValid ? `${currency} ${normalizedAmount}` : 'Not entered'}</CustomText></View>
        <View style={styles.reviewRow}><CustomText style={styles.reviewLabel}>Schedule</CustomText><CustomText style={styles.reviewValue}>{frequency === 'once' ? 'One time' : frequency}</CustomText></View>
        <View style={styles.reviewRow}><CustomText style={styles.reviewLabel}>Route</CustomText><CustomText style={styles.reviewValue}>{method?.label ?? 'Unavailable'}</CustomText></View>
        <View style={styles.notice}><MaterialIcons name="info-outline" size={18} color={theme.colors.primary} /><CustomText variant="caption" style={styles.noticeText}>This creates a tracked giving intent, not a completed payment. Follow only the approved instructions returned by the server.</CustomText></View>
        <AppButton title="Create giving request" variant="gradient" size="lg" fullWidth disabled={!amountValid || !method || configLoading} loading={submitting} loadingLabel="Validating request" onPress={() => void submit()} />
      </SurfaceCard>
    </PremiumPage>
  </>;
}

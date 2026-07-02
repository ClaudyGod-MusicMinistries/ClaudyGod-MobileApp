import React, { useMemo } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { FadeIn } from '../../components/ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { APP_ROUTES } from '../../util/appRoutes';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useToast } from '../../context/ToastContext';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  heroCard:       { padding: theme.spacing.xl, marginBottom: theme.spacing.lg },
  heroRow:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconBox: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${theme.colors.primary}1A`,
  },
  heroFill:       { flex: 1 },
  heroEyebrow:    { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 },
  heroTitle:      { color: theme.colors.text, marginTop: 5 },

  scroll:         { flex: 1 },
  sectionCard:    { padding: theme.spacing.lg },
  sectionHead:    { color: theme.colors.text },
  summaryList:    { marginTop: 12 },
  summaryRowBase: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 12 },
  summaryDivider: { borderTopColor: theme.colors.border },
  summaryLabel:   { color: theme.colors.textSecondary, flex: 1 },
  summaryValue:   { color: theme.colors.text, flex: 1, textAlign: 'right' },
  sectionBody:    { color: theme.colors.textSecondary, marginTop: 8 },
  btnsGap:        { gap: 10, marginTop: 16 },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

function titleCase(value: string) {
  if (!value) return '';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount?: string | string[];
    currency?: string | string[];
    frequency?: string | string[];
    methodId?: string | string[];
    methodLabel?: string | string[];
  }>();
  const { showToast } = useToast();
  const { config } = useMobileAppConfig();

  const amount       = getParam(params.amount);
  const currency     = getParam(params.currency) || config?.donate?.currency || 'USD';
  const frequency    = getParam(params.frequency) || 'monthly';
  const methodLabel  = getParam(params.methodLabel);
  const supportEmail = config?.privacy?.contactEmail ?? 'support@claudygod.org';

  const summaryItems = useMemo(
    () => [
      { label: 'Amount', value: amount ? `${amount} ${currency}` : 'Not selected' },
      { label: 'Rhythm', value: titleCase(frequency) },
      { label: 'Method', value: methodLabel || 'Preferred giving method' },
    ],
    [amount, currency, frequency, methodLabel],
  );

  const contactGivingTeam = () => {
    const subject = encodeURIComponent('Giving review');
    const body = encodeURIComponent(
      `Hello, I want to complete this giving request.\n\nAmount: ${amount || 'Not selected'} ${currency}\nRhythm: ${titleCase(frequency)}\nMethod: ${methodLabel || 'Preferred giving method'}\n`,
    );
    void Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  const completeReview = () => {
    showToast({
      title: 'Giving review ready',
      message: 'Use the available giving instructions or contact support to complete securely.',
      tone: 'info',
    });
  };

  return (
    <SettingsScaffold
      title="Review giving"
      subtitle="Confirm your giving details before completing securely."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroIconBox}>
                <MaterialIcons name="verified-user" size={28} color={theme.colors.primary} />
              </View>
              <View style={styles.heroFill}>
                <CustomText variant="caption" style={styles.heroEyebrow}>Secure review</CustomText>
                <CustomText variant="heading" style={styles.heroTitle}>Your giving details are ready</CustomText>
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={{ gap: theme.spacing.md }} showsVerticalScrollIndicator={false}>
        <SurfaceCard tone="subtle" style={styles.sectionCard}>
          <CustomText variant="heading" style={styles.sectionHead}>Summary</CustomText>
          <View style={styles.summaryList}>
            {summaryItems.map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.summaryRowBase,
                  styles.summaryDivider,
                  { borderTopWidth: index === 0 ? 0 : 1 },
                ]}
              >
                <CustomText variant="body" style={styles.summaryLabel}>{item.label}</CustomText>
                <CustomText variant="label" style={styles.summaryValue} numberOfLines={2}>{item.value}</CustomText>
              </View>
            ))}
          </View>
        </SurfaceCard>

        <SurfaceCard tone="subtle" style={styles.sectionCard}>
          <CustomText variant="heading" style={styles.sectionHead}>Complete securely</CustomText>
          <CustomText variant="body" style={styles.sectionBody}>
            Complete giving through the approved giving route configured for the ministry, or contact support for manual assistance.
          </CustomText>
          <View style={styles.btnsGap}>
            <AppButton title="Contact giving support" onPress={contactGivingTeam} leftIcon={<MaterialIcons name="support-agent" size={18} color={theme.colors.textInverse} />} />
            <AppButton title="Back to giving" variant="secondary" onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />
            <AppButton title="Done" variant="outline" onPress={completeReview} />
          </View>
        </SurfaceCard>
      </ScrollView>
    </SettingsScaffold>
  );
}

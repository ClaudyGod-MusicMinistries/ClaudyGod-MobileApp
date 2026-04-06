import React, { useMemo, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { CustomText } from '../../components/CustomText';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { FadeIn } from '../../components/ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { useAuth } from '../../context/AuthContext';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { createDonationIntent, createPublicDonationIntent } from '../../services/userFlowService';
import { formatCurrency } from '../../models/donationModels';

const fallbackMethods = [
  { id: 'card', label: 'Card / Apple Pay / Google Pay', subtitle: 'Secure checkout for cards and wallets', icon: 'credit-card' },
  { id: 'paystack', label: 'Paystack', subtitle: 'Local card & bank payments (NGN)', icon: 'bolt' },
  { id: 'flutterwave', label: 'Flutterwave', subtitle: 'Local transfers & cards (NGN)', icon: 'flare' },
  { id: 'bank', label: 'Bank transfer', subtitle: 'Manual transfer and reconciliation support', icon: 'account-balance' },
];

const parseAmountValue = (raw: string) => Number(String(raw || '').replace(/[^0-9.]/g, '')) || 0;

export default function PaymentScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { config } = useMobileAppConfig();
  const params = useLocalSearchParams();

  const amountParam = String(params.amount ?? '');
  const currencyParam = String(params.currency ?? config?.donate.currency ?? 'USD').toUpperCase();
  const frequencyParam = String(params.frequency ?? 'monthly');
  const methodParam = String(params.methodId ?? '');
  const planId = String(params.planId ?? '');

  const methods = useMemo(
    () =>
      (config?.donate.methods ?? fallbackMethods).map((method) => ({
        ...method,
        icon: method.icon as React.ComponentProps<typeof MaterialIcons>['name'],
      })),
    [config?.donate.methods],
  );

  const [selectedMethod, setSelectedMethod] = useState(methodParam || methods[0]?.id || 'card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [intent, setIntent] = useState<{
    id: string;
    status: string;
    currency: string;
    mode: string;
    instructions?: { title: string; message: string; actionLabel?: string; actionUrl?: string };
  } | null>(null);

  const amountValue = parseAmountValue(amountParam);
  const amountLabel = amountValue ? formatCurrency(amountValue, currencyParam) : amountParam || currencyParam;
  const cadenceLabel = frequencyParam === 'daily' ? 'Daily' : frequencyParam === 'weekly' ? 'Weekly' : frequencyParam === 'monthly' ? 'Monthly' : 'Once';

  const submitIntent = async () => {
    if (!amountParam) {
      Alert.alert('Missing amount', 'Select an amount before continuing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: amountParam,
        mode: frequencyParam as 'once' | 'daily' | 'weekly' | 'monthly',
        methodId: selectedMethod,
        currency: currencyParam,
        planId: planId || undefined,
        metadata: { screen: 'payment' },
      };
      const response = isAuthenticated
        ? await createDonationIntent(payload)
        : await createPublicDonationIntent(payload);

      setIntent({
        id: response.donationIntent.id,
        status: response.donationIntent.status,
        currency: response.donationIntent.currency,
        mode: response.donationIntent.mode,
        instructions: response.donationIntent.instructions,
      });
    } catch (error) {
      Alert.alert('Unable to start payment', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SettingsScaffold
      title="Payment"
      subtitle="Finalize your support securely."
      hero={
        <FadeIn>
          <SurfaceCard style={{ padding: spacing.lg }}>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, textTransform: 'uppercase' }}>
              Summary
            </CustomText>
            <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 6 }}>
              {cadenceLabel} support
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
              {amountLabel} · {currencyParam}
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
              Method: {methods.find((item) => item.id === selectedMethod)?.label ?? selectedMethod}
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <FadeIn delay={60}>
        <SurfaceCard style={{ padding: spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
            Payment method
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 3 }}>
            Select how you would like to complete the donation.
          </CustomText>

          <View style={{ gap: 8, marginTop: 12 }}>
            {methods.map((method) => {
              const active = selectedMethod === method.id;
              return (
                <TVTouchable
                  key={method.id}
                  onPress={() => setSelectedMethod(method.id)}
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? 'rgba(124,58,237,0.12)' : theme.colors.surfaceAlt,
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
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <MaterialIcons name={method.icon} size={18} color={active ? theme.colors.primary : theme.colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText variant="label" style={{ color: theme.colors.text }}>
                      {method.label}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
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
              title={intent ? 'Refresh payment instructions' : 'Generate payment instructions'}
              fullWidth
              loading={isSubmitting}
              onPress={submitIntent}
            />
          </View>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={90}>
        <SurfaceCard style={{ marginTop: spacing.lg, padding: spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
            How this works
          </CustomText>
          <View style={{ gap: 8, marginTop: 8 }}>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
              1. Generate secure payment instructions for {amountLabel}.
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
              2. Complete the payment through your selected method.
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
              3. Receive confirmation and a receipt from the ministry team.
            </CustomText>
          </View>
        </SurfaceCard>
      </FadeIn>

      {intent?.instructions ? (
        <FadeIn delay={120}>
          <SurfaceCard style={{ marginTop: spacing.lg, padding: spacing.md }}>
            <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
              {intent.instructions.title}
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
              {intent.instructions.message}
            </CustomText>
            <View style={{ marginTop: 12, flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {intent.instructions.actionLabel ? (
                <AppButton
                  title={intent.instructions.actionLabel}
                  variant="secondary"
                  onPress={() => {
                    if (!intent.instructions?.actionUrl) {
                      Alert.alert('Ready', 'A secure payment link will be shared shortly.');
                      return;
                    }
                    Linking.openURL(intent.instructions.actionUrl);
                  }}
                />
              ) : null}
              <AppButton
                title="Done"
                onPress={() => router.replace('/(tabs)/home')}
                leftIcon={<MaterialIcons name="check" size={16} color={theme.colors.textInverse} />}
              />
            </View>
          </SurfaceCard>
        </FadeIn>
      ) : null}

      <FadeIn delay={160}>
        <SurfaceCard style={{ marginTop: spacing.lg, padding: spacing.md }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
            Need help?
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
            If you need receipts, local transfer support, or have payment questions, contact the support team.
          </CustomText>
          <View style={{ marginTop: 12 }}>
            <AppButton
              title="Contact support"
              variant="outline"
              onPress={() => router.push('/settingsPage/help')}
              leftIcon={<MaterialIcons name="support-agent" size={16} color={theme.colors.text} />}
            />
          </View>
        </SurfaceCard>
      </FadeIn>
    </SettingsScaffold>
  );
}

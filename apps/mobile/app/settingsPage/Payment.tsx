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
import { APP_ROUTES } from '../../util/appRoutes';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useToast } from '../../context/ToastContext';

const getParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] ?? '' : value ?? '');

function titleCase(value: string) {
  if (!value) return '';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export default function PaymentScreen() {
  const theme = useAppTheme();
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

  const amount = getParam(params.amount);
  const currency = getParam(params.currency) || config?.donate?.currency || 'USD';
  const frequency = getParam(params.frequency) || 'monthly';
  const methodLabel = getParam(params.methodLabel);
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
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}1A` }}>
                <MaterialIcons name="verified-user" size={28} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  Secure review
                </CustomText>
                <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 5 }}>
                  Your giving details are ready
                </CustomText>
              </View>
            </View>
          </SurfaceCard>
        </FadeIn>
      }
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: theme.spacing.md }} showsVerticalScrollIndicator={false}>
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Summary
          </CustomText>
          <View style={{ marginTop: 12 }}>
            {summaryItems.map((item, index) => (
              <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 12, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: theme.colors.border }}>
                <CustomText variant="body" style={{ color: theme.colors.textSecondary, flex: 1 }}>
                  {item.label}
                </CustomText>
                <CustomText variant="label" style={{ color: theme.colors.text, flex: 1, textAlign: 'right' }} numberOfLines={2}>
                  {item.value}
                </CustomText>
              </View>
            ))}
          </View>
        </SurfaceCard>

        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Complete securely
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            Complete giving through the approved giving route configured for the ministry, or contact support for manual assistance.
          </CustomText>
          <View style={{ gap: 10, marginTop: 16 }}>
            <AppButton title="Contact giving support" onPress={contactGivingTeam} leftIcon={<MaterialIcons name="support-agent" size={18} color={theme.colors.textInverse} />} />
            <AppButton title="Back to giving" variant="secondary" onPress={() => router.push(APP_ROUTES.settingsPages.donate)} />
            <AppButton title="Done" variant="outline" onPress={completeReview} />
          </View>
        </SurfaceCard>
      </ScrollView>
    </SettingsScaffold>
  );
}

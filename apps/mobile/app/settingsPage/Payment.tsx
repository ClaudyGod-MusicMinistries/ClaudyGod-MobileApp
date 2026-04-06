import React, { useState } from 'react';
import { View, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../components/CustomText';
import { AppButton } from '../../components/ui/AppButton';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { Screen } from '../../components/layout/Screen';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { colors } from '../../constants/color';
import { spacing, radius } from '../../styles/designTokens';
import { useToast } from '../../context/ToastContext';
import type { DonationFrequency } from '../../models/donationModels';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  available: boolean;
  color: string;
  processingFee: number;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: 'credit-card',
    description: 'Visa, Mastercard, or American Express',
    available: true,
    color: '#60A5FA',
    processingFee: 2.9,
  },
  {
    id: 'mobile',
    name: 'Mobile Money',
    icon: 'phone-in-talk',
    description: 'Airtel Money, MTN Money, or similar',
    available: true,
    color: '#34D399',
    processingFee: 1,
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: 'account-balance',
    description: 'Direct bank account transfer',
    available: true,
    color: '#F87171',
    processingFee: 0.5,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'payment',
    description: 'PayPal account payment',
    available: false,
    color: '#FBBF24',
    processingFee: 3.5,
  },
];

function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    KES: 'KSh',
  };
  const symbol = symbols[currency] || '$';
  return `${symbol}${amount.toFixed(2)}`;
}

function getDonationFrequencyText(frequency: DonationFrequency): string {
  const map: Record<DonationFrequency, string> = {
    daily: 'Every day',
    weekly: 'Every week',
    monthly: 'Every month',
  };
  return map[frequency] || 'Monthly';
}

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const isCompact = width < 380;

  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const donationAmount = parseFloat((params.amount as string) || '50');
  const frequency = (params.frequency as DonationFrequency) || 'monthly';
  const currency = (params.currency as string) || 'USD';

  const selectedPaymentMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
  const processingFee = selectedPaymentMethod ? (donationAmount * selectedPaymentMethod.processingFee) / 100 : 0;
  const totalAmount = donationAmount + processingFee;

  const handlePaymentMethodSelect = (methodId: string) => {
    const method = PAYMENT_METHODS.find((m) => m.id === methodId);
    if (method?.available) {
      setSelectedMethod(methodId);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedMethod) {
      showToast({
        title: 'Select Payment Method',
        message: 'Please select a payment method to continue',
        tone: 'warning',
      });
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setShowConfirmation(true);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      showToast({
        title: 'Donation Confirmed',
        message: `Thank you for your ${frequency} support!`,
        tone: 'success',
      });

      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Payment error:', error);
      showToast({
        title: 'Payment Failed',
        message: 'There was an error processing your payment. Please try again.',
        tone: 'warning',
      });
      setIsProcessing(false);
    }
  };

  if (showConfirmation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark.background }} edges={['top', 'bottom']}>
        <LinearGradient
          colors={['rgba(52, 211, 153, 0.06)', 'rgba(26, 20, 47, 0.8)', 'rgba(8, 6, 14, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg }}>
            <FadeIn>
              <View
                style={{
                  width: isTablet ? 100 : 88,
                  height: isTablet ? 100 : 88,
                  borderRadius: isTablet ? 50 : 44,
                  backgroundColor: 'rgba(52, 211, 153, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.xl,
                  borderWidth: 2,
                  borderColor: '#34D399',
                }}
              >
                <MaterialIcons name="check-circle" size={isTablet ? 56 : 50} color="#34D399" />
              </View>

              <View style={{ alignItems: 'center', gap: spacing.md }}>
                <CustomText
                  variant="heading"
                  style={{
                    color: colors.dark.text,
                    textAlign: 'center',
                    fontSize: isTablet ? 32 : 28,
                  }}
                >
                  Thank You!
                </CustomText>

                <CustomText
                  variant="body"
                  style={{
                    color: colors.dark.textSecondary,
                    textAlign: 'center',
                    fontSize: isTablet ? 15 : 13.5,
                    maxWidth: 320,
                    lineHeight: 20,
                  }}
                >
                  Your donation has been received and processed successfully.
                </CustomText>

                <View
                  style={{
                    backgroundColor: 'rgba(52, 211, 153, 0.08)',
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: 'rgba(52, 211, 153, 0.16)',
                    paddingVertical: spacing.lg,
                    paddingHorizontal: spacing.lg,
                    width: '100%',
                    alignItems: 'center',
                    marginTop: spacing.lg,
                  }}
                >
                  <CustomText
                    variant="label"
                    style={{
                      color: colors.dark.textSecondary,
                      fontSize: 12,
                      marginBottom: spacing.xs,
                    }}
                  >
                    Donation Amount
                  </CustomText>
                  <CustomText
                    variant="hero"
                    style={{
                      color: '#34D399',
                      fontSize: isTablet ? 28 : 24,
                      fontWeight: '700',
                    }}
                  >
                    {formatCurrency(donationAmount, currency)}
                  </CustomText>
                  <CustomText
                    variant="label"
                    style={{
                      color: colors.dark.textSecondary,
                      fontSize: 12,
                      marginTop: spacing.xs,
                      textTransform: 'capitalize',
                    }}
                  >
                    {getDonationFrequencyText(frequency)}
                  </CustomText>
                </View>

                <CustomText
                  variant="body"
                  style={{
                    color: colors.dark.textSecondary,
                    textAlign: 'center',
                    fontSize: 12.5,
                    marginTop: spacing.lg,
                  }}
                >
                  A receipt has been sent to your email. Thank you for supporting the ministry!
                </CustomText>
              </View>
            </FadeIn>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark.background }} edges={['top', 'bottom']}>
      <Screen>
        <LinearGradient
          colors={['rgba(167, 139, 250, 0.06)', 'rgba(26, 20, 47, 0.8)', 'rgba(8, 6, 14, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: isCompact ? spacing.md : spacing.lg,
              paddingVertical: spacing.lg,
              gap: spacing.xl,
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <FadeIn>
              <View style={{ gap: spacing.sm }}>
                <CustomText
                  variant="heading"
                  style={{
                    color: colors.dark.text,
                    fontSize: isTablet ? 22 : 20,
                  }}
                >
                  Complete Your Donation
                </CustomText>

                <CustomText
                  variant="body"
                  style={{
                    color: colors.dark.textSecondary,
                    fontSize: isTablet ? 14 : 13,
                  }}
                >
                  Choose a payment method to proceed
                </CustomText>
              </View>
            </FadeIn>

            {/* Order Summary */}
            <SurfaceCard
              style={{
                padding: spacing.lg,
                gap: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <CustomText
                  variant="body"
                  style={{
                    color: colors.dark.textSecondary,
                    fontSize: 13,
                  }}
                >
                  Donation Amount
                </CustomText>
                <CustomText
                  variant="title"
                  style={{
                    color: colors.dark.accent,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  {formatCurrency(donationAmount, currency)}
                </CustomText>
              </View>

              <View style={{ height: 1, backgroundColor: 'rgba(167, 139, 250, 0.08)' }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <CustomText
                  variant="body"
                  style={{
                    color: colors.dark.textSecondary,
                    fontSize: 13,
                  }}
                >
                  Frequency
                </CustomText>
                <CustomText
                  variant="body"
                  style={{
                    color: colors.dark.text,
                    fontSize: 13,
                    textTransform: 'capitalize',
                  }}
                >
                  {getDonationFrequencyText(frequency)}
                </CustomText>
              </View>

              {selectedPaymentMethod && processingFee > 0 && (
                <>
                  <View style={{ height: 1, backgroundColor: 'rgba(167, 139, 250, 0.08)' }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <CustomText
                      variant="body"
                      style={{
                        color: colors.dark.textSecondary,
                        fontSize: 13,
                      }}
                    >
                      Processing Fee ({selectedPaymentMethod.processingFee}%)
                    </CustomText>
                    <CustomText
                      variant="body"
                      style={{
                        color: colors.dark.textSecondary,
                        fontSize: 13,
                      }}
                    >
                      {formatCurrency(processingFee, currency)}
                    </CustomText>
                  </View>
                </>
              )}

              <View style={{ height: 1, backgroundColor: 'rgba(167, 139, 250, 0.2)' }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <CustomText
                  variant="title"
                  style={{
                    color: colors.dark.text,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Total
                </CustomText>
                <CustomText
                  variant="heading"
                  style={{
                    color: colors.dark.accent,
                    fontSize: 18,
                    fontWeight: '700',
                  }}
                >
                  {formatCurrency(totalAmount, currency)}
                </CustomText>
              </View>
            </SurfaceCard>

            {/* Payment Methods */}
            <View style={{ gap: spacing.md }}>
              <CustomText
                variant="heading"
                style={{
                  color: colors.dark.text,
                  fontSize: isTablet ? 18 : 16,
                }}
              >
                Payment Method
              </CustomText>

              <View style={{ gap: spacing.sm }}>
                {PAYMENT_METHODS.map((method) => (
                  <FadeIn key={method.id}>
                    <TVTouchable
                      onPress={() => handlePaymentMethodSelect(method.id)}
                      disabled={!method.available}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                        borderRadius: radius.lg,
                        backgroundColor:
                          selectedMethod === method.id
                            ? 'rgba(167, 139, 250, 0.12)'
                            : 'rgba(167, 139, 250, 0.04)',
                        borderWidth: 2,
                        borderColor:
                          selectedMethod === method.id
                            ? 'rgba(167, 139, 250, 0.4)'
                            : 'rgba(167, 139, 250, 0.08)',
                        opacity: method.available ? 1 : 0.5,
                      }}
                    >
                      <View
                        style={{
                          width: isTablet ? 48 : 44,
                          height: isTablet ? 48 : 44,
                          borderRadius: radius.md,
                          backgroundColor: method.color + '22',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <MaterialIcons name={method.icon as any} size={isTablet ? 24 : 22} color={method.color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <CustomText
                          variant="title"
                          style={{
                            color: colors.dark.text,
                            fontSize: isTablet ? 15 : 14,
                            marginBottom: spacing.xs,
                          }}
                        >
                          {method.name}
                        </CustomText>
                        <CustomText
                          variant="caption"
                          style={{
                            color: method.available ? colors.dark.textSecondary : colors.dark.textSecondary,
                            fontSize: 12,
                          }}
                        >
                          {method.available ? method.description : 'Coming soon'}
                        </CustomText>
                      </View>

                      {selectedMethod === method.id && (
                        <View
                          style={{
                            width: isTablet ? 24 : 20,
                            height: isTablet ? 24 : 20,
                            borderRadius: isTablet ? 12 : 10,
                            backgroundColor: colors.dark.accent,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MaterialIcons name="check" size={isTablet ? 14 : 12} color="white" />
                        </View>
                      )}
                    </TVTouchable>
                  </FadeIn>
                ))}
              </View>
            </View>

            {/* Security Info */}
            <View
              style={{
                backgroundColor: 'rgba(96, 165, 250, 0.06)',
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: 'rgba(96, 165, 250, 0.12)',
                padding: spacing.lg,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.md,
              }}
            >
              <MaterialIcons name="shield" size={20} color="#60A5FA" style={{ marginTop: spacing.xs }} />
              <CustomText
                variant="body"
                style={{
                  color: colors.dark.textSecondary,
                  fontSize: 12.5,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                Your payment information is secure and encrypted. We never store your full payment details.
              </CustomText>
            </View>

            {/* Action Button */}
            <AppButton
              title={isProcessing ? 'Processing...' : 'Complete Donation'}
              onPress={handleProcessPayment}
              fullWidth
              disabled={isProcessing || !selectedMethod}
              style={{
                borderRadius: radius.md,
                backgroundColor: colors.dark.accent,
                marginTop: spacing.md,
                marginBottom: spacing.lg,
              }}
            />

            {isProcessing && (
              <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <ActivityIndicator size="small" color={colors.dark.accent} />
                <CustomText
                  variant="caption"
                  style={{
                    color: colors.dark.textSecondary,
                    fontSize: 12,
                  }}
                >
                  Processing your donation...
                </CustomText>
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </Screen>
    </SafeAreaView>
  );
}

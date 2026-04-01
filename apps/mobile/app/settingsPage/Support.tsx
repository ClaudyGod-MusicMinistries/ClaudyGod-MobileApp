/**
 * Support Ministry - Donation Screen
 * Allows users to select donation frequency and amount
 */

import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../../components/CustomText';
import { AppButton } from '../../components/ui/AppButton';
import { colors } from '../../constants/color';
import { spacing, radius } from '../../styles/designTokens';
import {
  DONATION_TIERS,
  DonationTier,
  DonationFrequency,
  formatCurrency,
  createDonationSession,
} from '../../models/donationModels';

export default function SupportScreen() {
  const router = useRouter();
  const colorsLight = colors.light;
  const [selectedFrequency, setSelectedFrequency] = useState<DonationFrequency>('monthly');
  const [selectedTier, setSelectedTier] = useState<DonationTier>(DONATION_TIERS.monthly);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);

  const handleFrequencyChange = (frequency: DonationFrequency) => {
    setSelectedFrequency(frequency);
    setSelectedTier(DONATION_TIERS[frequency]);
    setSelectedAmount(DONATION_TIERS[frequency].amounts[0]);
  };

  const handleProceedToPayment = () => {
    const session = createDonationSession(selectedTier, selectedAmount, null);
    router.push({
      pathname: '/settingsPage/Payment',
      params: { sessionId: session.id, amount: selectedAmount.toString() },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colorsLight.text.primary} />
          </Pressable>
          <CustomText style={styles.headerTitle}>Support Our Ministry</CustomText>
          <View style={{ width: 24 }} />
        </View>

        {/* Hero Section */}
        <LinearGradient
          colors={[colorsLight.primary, colorsLight.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <MaterialIcons name="favorite" size={48} color="white" />
          <CustomText style={styles.heroTitle}>Make a Difference</CustomText>
          <CustomText style={styles.heroSubtitle}>
            Your generosity helps us reach and inspire more people with the Gospel
          </CustomText>
        </LinearGradient>

        {/* Frequency Selection */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Choose Frequency</CustomText>
          <View style={styles.frequencyGrid}>
            {(Object.keys(DONATION_TIERS) as DonationFrequency[]).map((freq) => (
              <Pressable
                key={freq}
                onPress={() => handleFrequencyChange(freq)}
                style={[
                  styles.frequencyCard,
                  selectedFrequency === freq && styles.frequencyCardActive,
                ]}
              >
                <MaterialIcons
                  name={DONATION_TIERS[freq].icon as any}
                  size={28}
                  color={selectedFrequency === freq ? 'white' : colorsLight.accent}
                />
                <CustomText
                  style={[
                    styles.frequencyCardText,
                    selectedFrequency === freq && styles.frequencyCardTextActive,
                  ]}
                >
                  {DONATION_TIERS[freq].name}
                </CustomText>
                {DONATION_TIERS[freq].badge && (
                  <CustomText style={styles.badge}>{DONATION_TIERS[freq].badge}</CustomText>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Amount Selection */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Select Amount</CustomText>
          <View style={styles.amountGrid}>
            {selectedTier.amounts.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => setSelectedAmount(amount)}
                style={[styles.amountCard, selectedAmount === amount && styles.amountCardActive]}
              >
                <CustomText
                  style={[
                    styles.amountText,
                    selectedAmount === amount && styles.amountTextActive,
                  ]}
                >
                  {formatCurrency(amount)}
                </CustomText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Summary */}
        <LinearGradient
          colors={[colors_light.surface, colors_light.surfaceAlt]}
          style={styles.summary}
        >
          <View style={styles.summaryRow}>
            <CustomText style={styles.summaryLabel}>Frequency</CustomText>
            <CustomText style={styles.summaryValue}>{selectedTier.name}</CustomText>
          </View>
          <View style={[styles.summaryRow, styles.divider]} />
          <View style={styles.summaryRow}>
            <CustomText style={styles.summaryLabel}>Amount</CustomText>
            <CustomText style={styles.summaryAmount}>{formatCurrency(selectedAmount)}</CustomText>
          </View>
        </LinearGradient>

        {/* Benefits */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Your Support Helps</CustomText>
          <View style={styles.benefitsList}>
            {[
              'Reach more listeners through digital platforms',
              'Produce quality content for spiritual growth',
              'Support our ministry team',
              'Expand our community outreach programs',
            ].map((benefit, idx) => (
              <View key={idx} style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color={colorsLight.success} />
                <CustomText style={styles.benefitText}>{benefit}</CustomText>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <AppButton
          title="Proceed to Payment"
          size="lg"
          onPress={handleProceedToPayment}
          fullWidth
          style={{ marginHorizontal: spacing.md, marginBottom: spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const colors_light = colors.light;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors_light.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors_light.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors_light.text.primary,
  },
  heroSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors_light.text.primary,
    marginBottom: spacing.md,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  frequencyCard: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors_light.surface,
    borderWidth: 2,
    borderColor: colors_light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyCardActive: {
    backgroundColor: colors_light.accent,
    borderColor: colors_light.accent,
  },
  frequencyCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors_light.text.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  frequencyCardTextActive: {
    color: 'white',
  },
  badge: {
    fontSize: 8,
    fontWeight: '700',
    color: colors_light.accent,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amountCard: {
    flex: 1,
    minWidth: '31%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors_light.surface,
    borderWidth: 2,
    borderColor: colors_light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCardActive: {
    backgroundColor: colors_light.accent,
    borderColor: colors_light.accent,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors_light.text.primary,
  },
  amountTextActive: {
    color: 'white',
  },
  summary: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  divider: {
    marginVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors_light.border,
    paddingVertical: 0,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors_light.text.secondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors_light.text.primary,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors_light.accent,
  },
  benefitsList: {
    gap: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: colors_light.text.primary,
    lineHeight: 18,
  },
});

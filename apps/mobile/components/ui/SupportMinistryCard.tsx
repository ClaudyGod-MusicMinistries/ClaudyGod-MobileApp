/**
 * Support Ministry Card Component
 * Beautiful card for donation/support action
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { colors } from '../../constants/color';
import { spacing, radius } from '../../styles/designTokens';

interface SupportCardProps {
  onPress: () => void;
}

export function SupportMinistryCard({ onPress }: SupportCardProps) {
  const palette = colors.light;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <LinearGradient
        colors={[palette.primary, palette.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { marginHorizontal: spacing.md, marginBottom: spacing.lg }]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="favorite" size={32} color="white" />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <CustomText style={styles.badge}>SUPPORT OUR MINISTRY</CustomText>
          <CustomText style={styles.title}>Help Us Spread The Gospel</CustomText>
          <CustomText style={styles.description}>
            Your generosity enables us to reach more people with the message of faith and hope
          </CustomText>
        </View>

        {/* CTA Arrow */}
        <View style={styles.cta}>
          <CustomText style={styles.ctaText}>Click Here</CustomText>
          <MaterialIcons name="arrow-forward" size={20} color="white" style={{ marginLeft: spacing.xs }} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const colors_light = colors.light;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: colors_light.accent,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  content: {
    marginBottom: spacing.md,
  },
  badge: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ctaText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
});

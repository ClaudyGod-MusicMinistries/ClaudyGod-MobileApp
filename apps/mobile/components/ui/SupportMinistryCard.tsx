import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../CustomText';
import { makeStyles } from '../../styles/makeStyles';
import { TVTouchable } from './TVTouchable';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  card: {
    minHeight: 104, borderRadius: 14, padding: 15,
    overflow: 'hidden', justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  decoCircle: {
    position: 'absolute', right: -22, top: -18,
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)',
  },
  textFill:    { flex: 1, minWidth: 0 },
  eyebrow:     { color: 'rgba(255,255,255,0.76)', textTransform: 'uppercase', letterSpacing: 0.72 },
  titleText:   { color: '#FFFFFF', marginTop: 3 },
  bodyText:    { color: 'rgba(255,255,255,0.78)', marginTop: 5, lineHeight: 17 },
  ctaBtnBase: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    minHeight: 38, borderRadius: 999, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)', backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center', flexShrink: 0,
  },
  ctaLabel: { color: '#FFFFFF' },
}));

// ─── Component ────────────────────────────────────────────────────────────────

interface SupportCardProps {
  onPress: () => void;
}

export function SupportMinistryCard({ onPress }: SupportCardProps) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <View style={styles.card}>
      <View style={styles.decoCircle} />

      <View style={styles.row}>
        <View style={styles.iconBox}>
          <MaterialIcons name="volunteer-activism" size={20} color="#FFFFFF" />
        </View>

        <View style={styles.textFill}>
          <CustomText variant="caption" style={styles.eyebrow}>Support</CustomText>
          <CustomText variant="title" style={styles.titleText} numberOfLines={1}>
            Partner with the ministry
          </CustomText>
          <CustomText variant="caption" style={styles.bodyText} numberOfLines={2}>
            Help keep worship, messages, and live moments available to more people.
          </CustomText>
        </View>

        <TVTouchable
          onPress={onPress}
          showFocusBorder={false}
          style={[
            styles.ctaBtnBase,
            {
              gap: compact ? 0 : 6,
              width: compact ? 40 : undefined,
              paddingHorizontal: compact ? 0 : 12,
            },
          ]}
          accessibilityLabel="Give support"
        >
          {!compact ? (
            <CustomText variant="label" style={styles.ctaLabel} numberOfLines={1}>
              Give support
            </CustomText>
          ) : null}
          <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
        </TVTouchable>
      </View>
    </View>
  );
}

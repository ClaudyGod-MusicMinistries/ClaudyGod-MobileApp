import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '../CustomText';
import { BRAND_LOGO_ASSET, BRAND_WORSHIP_ASSET } from '../../util/brandAssets';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // Full variant panel
  panelBase:  { flex: 1, overflow: 'hidden', backgroundColor: theme.colors.background },
  bgImg:      { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.55 },
  gradient:   { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  innerFill:  { flex: 1, justifyContent: 'space-between' },

  // Compact variant
  compactRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  compactLogoBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: theme.colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  compactLogoImg:    { width: 28, height: 28, borderRadius: 8 },
  compactTextFill:   { flex: 1, minWidth: 0 },
  compactBrandName:  { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1.1, fontSize: 10 },
  compactTagline:    { color: theme.colors.textMuted, marginTop: 2, fontSize: 12, fontWeight: '400' },

  // Full variant — static parts only
  chipsRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  chip: {
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 12, paddingVertical: 5,
  },
  chipText:          { color: '#7A7288', fontSize: 11, fontWeight: '400' },
}));

// ─── Component ────────────────────────────────────────────────────────────────

interface AuthBrandPanelProps {
  salutation: string;
  description: string;
  compact?: boolean;
}

export function AuthBrandPanel({ salutation, description, compact = false }: AuthBrandPanelProps) {
  const styles = useStyles();
  const device = useDeviceClass();
  const theme  = useAppTheme();

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <View style={styles.compactLogoBox}>
          <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={styles.compactLogoImg} />
        </View>
        <View style={styles.compactTextFill}>
          <CustomText variant="caption" style={styles.compactBrandName}>ClaudyGod</CustomText>
          <CustomText variant="label" style={styles.compactTagline} numberOfLines={1}>
            Music · Worship · Live Ministry
          </CustomText>
        </View>
      </View>
    );
  }

  const minHeight = device.isTV ? 620 : device.isDesktop ? 540 : 440;
  const titleSize = device.isTV ? 40 : device.isDesktop ? 33 : 28;

  return (
    <View style={[styles.panelBase, { minHeight, borderRadius: device.isTV ? 32 : 24 }]}>
      <Image source={BRAND_WORSHIP_ASSET} resizeMode="cover" style={styles.bgImg} />

      <LinearGradient
        colors={['rgba(7,5,12,0)', 'rgba(7,5,12,0.72)', 'rgba(7,5,12,0.98)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />

      <View style={[styles.innerFill, { padding: device.isTV ? 36 : 28 }]}>
        <View
          style={{
            width: device.isTV ? 64 : 54, height: device.isTV ? 64 : 54,
            borderRadius: device.isTV ? 22 : 18,
            backgroundColor: theme.colors.elevated,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={{ width: device.isTV ? 40 : 34, height: device.isTV ? 40 : 34, borderRadius: 10 }} />
        </View>

        <View style={{ maxWidth: device.isTV ? 500 : 400 }}>
          <CustomText
            variant="display"
            style={{ color: '#F7F2FF', fontSize: titleSize, lineHeight: titleSize * 1.15, fontWeight: '700', letterSpacing: -0.5 }}
          >
            {salutation}
          </CustomText>
          <CustomText
            variant="body"
            style={{ color: '#9287AD', marginTop: 10, lineHeight: device.isTV ? 24 : 20, fontSize: device.isTV ? 14 : 13 }}
          >
            {description}
          </CustomText>

          <View style={styles.chipsRow}>
            {(['Worship Music', 'Live Sessions', 'Video Messages', 'Daily Word'] as const).map((label) => (
              <View key={label} style={styles.chip}>
                <CustomText variant="caption" style={styles.chipText}>{label}</CustomText>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

import React from 'react';
import { Image, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { BRAND_LOGO_ASSET } from '../../util/brandAssets';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { CustomText } from '../CustomText';
import { SurfaceCard } from '../ui/SurfaceCard';

const useStyles = makeStyles((theme) => ({
  card: { padding: theme.spacing.xl, gap: theme.spacing.lg },
  ornamentLarge: { position: 'absolute', width: 156, height: 156, borderRadius: 78, right: -54, top: -68, backgroundColor: theme.colors.primarySurface },
  ornamentSmall: { position: 'absolute', width: 74, height: 74, borderRadius: 37, right: 72, bottom: -40, backgroundColor: theme.colors.subtleFill },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoFrame: { width: 48, height: 48, borderRadius: 16, padding: 7, backgroundColor: theme.colors.elevated, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  logo: { width: '100%', height: '100%', borderRadius: 10 },
  titleWrap: { flex: 1, minWidth: 0 },
  eyebrow: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  kicker: { color: theme.colors.textSecondary, marginTop: 3 },
  display: { color: theme.colors.text, maxWidth: 680 },
  body: { color: theme.colors.textSecondary, lineHeight: 22, maxWidth: 720 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: theme.colors.primarySurface, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  badgeText: { color: theme.colors.text_accent, fontWeight: '700' },
}));

interface PremiumSettingsHeroProps {
  eyebrow: string;
  kicker?: string;
  title: string;
  description: string;
  badge?: string;
  badgeIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  children?: React.ReactNode;
}

export function PremiumSettingsHero({ eyebrow, kicker, title, description, badge, badgeIcon = 'verified', children }: PremiumSettingsHeroProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <SurfaceCard tone="strong" style={styles.card}>
      <View style={styles.ornamentLarge} />
      <View style={styles.ornamentSmall} />
      <View style={styles.topRow}>
        <View style={styles.logoFrame}>
          <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={styles.logo} accessibilityLabel="ClaudyGod" />
        </View>
        <View style={styles.titleWrap}>
          <CustomText variant="caption" style={styles.eyebrow}>{eyebrow}</CustomText>
          {kicker ? <CustomText variant="caption" style={styles.kicker}>{kicker}</CustomText> : null}
        </View>
      </View>
      <CustomText variant="display" style={styles.display}>{title}</CustomText>
      <CustomText variant="body" style={styles.body}>{description}</CustomText>
      {badge ? (
        <View style={styles.badge}>
          <MaterialIcons name={badgeIcon} size={15} color={theme.colors.primary} />
          <CustomText variant="caption" style={styles.badgeText}>{badge}</CustomText>
        </View>
      ) : null}
      {children}
    </SurfaceCard>
  );
}

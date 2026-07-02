import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { CustomText } from '../CustomText';
import { AppButton } from '../ui/AppButton';

type HeroAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
};

interface CinematicHeroCardProps {
  imageSource?: ImageSourcePropType;
  imageUrl?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  height?: number;
  actions?: HeroAction[];
  overlayStrength?: number;
  contentSurface?: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  cardBase: {
    borderRadius: theme.radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  contentOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md,
  },
  outerGap:  { gap: 6 },
  innerGap:  { gap: 4 },
  surfaceOn: {
    borderRadius: theme.radius.lg, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(8,8,16,0.82)',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
    gap: 10,
  },
  surfaceOff: { gap: 8 },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: theme.radius.pill, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(141,99,255,0.12)',
  },
  badgeText:    { color: theme.colors.text_accent },
  eyebrowText:  { color: 'rgba(226,218,255,0.74)', textTransform: 'uppercase', letterSpacing: 0.75 },
  titleText:    { color: theme.colors.text },
  subtitleText: { color: 'rgba(230,224,246,0.76)' },
  descText:     { color: 'rgba(221,214,238,0.72)', maxWidth: '86%' },
  actionsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  actionSecondary: { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(11,13,22,0.86)' },
  actionPrimary:   { backgroundColor: theme.colors.primary },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function CinematicHeroCard({
  imageSource,
  imageUrl,
  eyebrow,
  title,
  subtitle,
  description,
  badge,
  height = 360,
  actions = [],
  overlayStrength = 0.94,
  contentSurface = true,
}: CinematicHeroCardProps) {
  const styles = useStyles();
  const theme = useAppTheme();

  return (
    <View style={[styles.cardBase, { height }]}>
      <Image
        source={imageSource ?? { uri: imageUrl }}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={[
          'rgba(7,9,12,0.08)',
          'rgba(7,9,12,0.34)',
          `rgba(7,9,12,${overlayStrength})`,
        ]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.contentOverlay}>
        <View style={styles.outerGap}>
          <View style={contentSurface ? styles.surfaceOn : styles.surfaceOff}>
            {badge ? (
              <View style={styles.badge}>
                <CustomText variant="caption" style={styles.badgeText}>{badge}</CustomText>
              </View>
            ) : null}

            {eyebrow ? (
              <CustomText variant="caption" style={styles.eyebrowText}>{eyebrow}</CustomText>
            ) : null}

            <View style={styles.innerGap}>
              <CustomText variant="hero" style={styles.titleText} numberOfLines={2}>
                {title}
              </CustomText>
              {subtitle ? (
                <CustomText variant="subtitle" style={styles.subtitleText} numberOfLines={1}>
                  {subtitle}
                </CustomText>
              ) : null}
              {description ? (
                <CustomText variant="body" style={styles.descText} numberOfLines={2}>
                  {description}
                </CustomText>
              ) : null}
            </View>

            {actions.length ? (
              <View style={styles.actionsRow}>
                {actions.map((action) => (
                  <AppButton
                    key={`${action.label}-${action.icon ?? 'action'}`}
                    title={action.label}
                    onPress={action.onPress}
                    variant={action.variant ?? 'primary'}
                    size="sm"
                    style={
                      action.variant === 'secondary'
                        ? styles.actionSecondary
                        : action.variant === 'primary'
                          ? styles.actionPrimary
                          : undefined
                    }
                    textColor={action.variant === 'secondary' ? theme.colors.text : undefined}
                    leftIcon={
                      action.icon ? (
                        <MaterialIcons
                          name={action.icon}
                          size={16}
                          color={
                            action.variant === 'outline' || action.variant === 'ghost'
                              ? theme.colors.text
                              : theme.colors.textInverse
                          }
                        />
                      ) : undefined
                    }
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

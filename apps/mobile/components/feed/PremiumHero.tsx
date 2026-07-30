import React from 'react';
import { Image, Platform, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '../CustomText';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { AppButton } from '../ui/AppButton';
import { FadeIn } from '../ui/FadeIn';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { useAppTheme } from '../../util/colorScheme';
import { common } from '../../styles/commonStyles';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import type { FeedCardItem } from '../../services/contentService';
import { useFeedStyles } from './styles';
import { isValidDuration } from './utils';

type PremiumHeroProps = {
  item?: FeedCardItem | null;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  actionLabel?: string;
  primaryLabel?: string;
  primaryIcon?: AppIconName;
  /** Icon shown in the empty/no-item prompt card. Ignored once `item` is set. */
  emptyIcon?: AppIconName;
  secondaryLabel?: string;
  secondaryIcon?: AppIconName;
  onPrimaryPress?: () => void;
  onPrimary?: () => void;
  onSecondaryPress?: () => void;
  onSecondary?: () => void;
  height?: number;
};

export function PremiumHero({
  item, title, subtitle, eyebrow,
  actionLabel, primaryLabel, primaryIcon = 'play-arrow',
  emptyIcon = 'auto-awesome',
  secondaryLabel, secondaryIcon = 'search',
  onPrimaryPress, onPrimary, onSecondaryPress, onSecondary,
  height,
}: PremiumHeroProps) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const isWide  = device.width >= 760;
  const primaryAction    = onPrimary ?? onPrimaryPress;
  const secondaryAction  = onSecondary ?? onSecondaryPress;
  const resolvedPrimaryLabel = primaryLabel ?? actionLabel ?? 'Play now';

  if (!item) {
    return (
      <FadeIn delay={30} duration={400}>
        <View style={styles.heroEmptyCard}>
          <LinearGradient
            colors={[`${theme.colors.primary}14`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={common.fill}
          />
          <View style={styles.heroEmptyCircle1} />
          <View style={styles.heroEmptyCircle2} />

          <View style={styles.heroEmptyIconShadowWrap}>
            <View style={styles.heroEmptyIconBox}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={common.fill}
              />
              <AppIcon name={emptyIcon} size={30} color={theme.colors.onPrimary} />
            </View>
          </View>

          <CustomText variant="heading" style={styles.heroEmptyTitle} numberOfLines={1}>
            {title ?? 'Nothing playing yet'}
          </CustomText>
          <CustomText variant="body" style={styles.heroEmptySubtitle} numberOfLines={2}>
            {subtitle ?? 'Pick something to get started.'}
          </CustomText>

          {(primaryAction || (secondaryLabel && secondaryAction)) ? (
            <View style={styles.heroEmptyCtaRow}>
              {primaryAction ? (
                <AppButton
                  title={resolvedPrimaryLabel}
                  variant="gradient"
                  onPress={primaryAction}
                  size="lg"
                  leftIcon={<AppIcon name={primaryIcon} size={17} color={theme.colors.onPrimary} />}
                />
              ) : null}
              {secondaryLabel && secondaryAction ? (
                <AppButton
                  title={secondaryLabel}
                  variant="secondary"
                  size="lg"
                  onPress={secondaryAction}
                  style={{ borderRadius: 999 }}
                  leftIcon={<AppIcon name={secondaryIcon} size={16} color={theme.colors.text} />}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </FadeIn>
    );
  }

  const isLarge = device.isDesktop || device.isTV;
  const heroHeight = height ?? (device.isTV ? 500 : device.isLargeDesktop ? 440 : isLarge ? 380 : isWide ? 330 : 272);
  const imageUrl = item.imageUrl || DEFAULT_CONTENT_IMAGE_URI;
  const isLiveItem = item.isLive;

  return (
    <FadeIn delay={30} duration={500}>
      <View style={[styles.heroContainer, { height: heroHeight }]}>
        <Image source={{ uri: imageUrl }} resizeMode="cover" style={common.fill} accessibilityIgnoresInvertColors />

        <LinearGradient
          colors={['transparent', theme.colors.mediaScrim, theme.colors.mediaScrimStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: isWide ? 0.7 : 0, y: 1 }}
          style={[common.fill, Platform.OS === 'web' ? { pointerEvents: 'none' } : {}]}
        />

        <View style={{ flex: 1, justifyContent: 'flex-end', padding: isWide ? 26 : 20 }}>
          <View style={{ maxWidth: isWide ? 580 : undefined }}>
            {(isLiveItem || eyebrow) ? (
              <View style={[styles.heroBadge, {
                borderColor: isLiveItem ? theme.colors.dangerBorder : theme.colors.mediaBorder,
                backgroundColor: isLiveItem ? theme.colors.dangerSurface : theme.colors.mediaControl,
              }]}>
                {isLiveItem ? <View style={[styles.heroBadgeDot, { backgroundColor: theme.colors.danger }]} /> : null}
                <CustomText style={{
                  color: isLiveItem ? theme.colors.danger : theme.colors.mediaText,
                  fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase',
                }}>
                  {isLiveItem ? 'Live now' : eyebrow ?? (item.type === 'video' ? 'Featured video' : 'Featured')}
                </CustomText>
              </View>
            ) : null}

            <CustomText
              variant="display"
              style={{
                color: theme.colors.mediaText,
                fontSize: device.isTV ? 42 : device.isLargeDesktop ? 36 : isLarge ? 30 : isWide ? 25 : 21,
                lineHeight: device.isTV ? 52 : device.isLargeDesktop ? 44 : isLarge ? 38 : isWide ? 32 : 28,
                fontWeight: '800', letterSpacing: 0,
              }}
              numberOfLines={2}
            >
              {item.title || title}
            </CustomText>

            <CustomText style={styles.heroMetaText}>
              {[item.subtitle, isValidDuration(item.duration) ? item.duration : null].filter(Boolean).join(' · ')}
            </CustomText>

            <CustomText variant="body" style={styles.heroSubtitle} numberOfLines={2}>
              {item.description || subtitle}
            </CustomText>

            <View style={styles.heroButtons}>
              {primaryAction ? (
                <AppButton
                  title={resolvedPrimaryLabel}
                  onPress={primaryAction}
                  size="md"
                  leftIcon={<AppIcon name={primaryIcon} size={17} color={theme.colors.textInverse} />}
                  style={{ flex: 1 }}
                />
              ) : null}
              {secondaryLabel && secondaryAction ? (
                <AppButton
                  title={secondaryLabel}
                  variant="secondary"
                  size="md"
                  onPress={secondaryAction}
                  textColor={theme.colors.mediaText}
                  leftIcon={<AppIcon name={secondaryIcon} size={16} color={theme.colors.mediaText} />}
                  style={{ flex: 1, backgroundColor: theme.colors.mediaControl, borderColor: theme.colors.mediaBorder }}
                />
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </FadeIn>
  );
}

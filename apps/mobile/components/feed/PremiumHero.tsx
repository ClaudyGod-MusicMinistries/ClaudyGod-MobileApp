import React from 'react';
import { Image, Platform, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
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
  primaryIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  /** Icon shown in the empty/no-item prompt card. Ignored once `item` is set. */
  emptyIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  secondaryLabel?: string;
  secondaryIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
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
              <MaterialIcons name={emptyIcon} size={32} color={theme.colors.onPrimary} />
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
                  leftIcon={<MaterialIcons name={primaryIcon} size={18} color={theme.colors.onPrimary} />}
                />
              ) : null}
              {secondaryLabel && secondaryAction ? (
                <AppButton
                  title={secondaryLabel}
                  variant="secondary"
                  size="lg"
                  onPress={secondaryAction}
                  style={{ borderRadius: 999 }}
                  leftIcon={<MaterialIcons name={secondaryIcon} size={16} color={theme.colors.text} />}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </FadeIn>
    );
  }

  const isLarge = device.isDesktop || device.isTV;
  const heroHeight = height ?? (device.isTV ? 540 : device.isLargeDesktop ? 480 : isLarge ? 420 : isWide ? 360 : 310);
  const imageUrl = item.imageUrl || DEFAULT_CONTENT_IMAGE_URI;
  const isLiveItem = item.isLive;

  return (
    <FadeIn delay={30} duration={500}>
      <View style={[styles.heroContainer, { height: heroHeight }]}>
        <Image source={{ uri: imageUrl }} resizeMode="cover" style={common.fill} />

        <LinearGradient
          colors={isWide
            ? ['rgba(5,4,10,0.10)', 'rgba(5,4,10,0.50)', 'rgba(5,4,10,0.96)']
            : ['rgba(5,4,10,0.06)', 'rgba(5,4,10,0.60)', 'rgba(5,4,10,0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: isWide ? 0.7 : 0, y: 1 }}
          style={[common.fill, Platform.OS === 'web' ? { pointerEvents: 'none' } : {}]}
        />

        <View style={{ flex: 1, justifyContent: 'flex-end', padding: isWide ? 26 : 20 }}>
          <View style={{ maxWidth: isWide ? 580 : undefined }}>
            {(isLiveItem || eyebrow) ? (
              <View style={[styles.heroBadge, {
                borderColor: isLiveItem ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.28)',
                backgroundColor: isLiveItem ? 'rgba(244,63,94,0.18)' : 'rgba(0,0,0,0.52)',
              }]}>
                {isLiveItem ? <View style={[styles.heroBadgeDot, { backgroundColor: theme.colors.danger }]} /> : null}
                <CustomText style={{
                  color: isLiveItem ? theme.colors.danger : 'rgba(255,255,255,0.9)',
                  fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase',
                }}>
                  {isLiveItem ? 'Live now' : eyebrow ?? (item.type === 'video' ? 'Featured video' : 'Featured')}
                </CustomText>
              </View>
            ) : null}

            <CustomText
              variant="display"
              style={{
                color: '#FFFFFF',
                fontSize: device.isTV ? 42 : device.isLargeDesktop ? 36 : isLarge ? 30 : isWide ? 25 : 21,
                lineHeight: device.isTV ? 52 : device.isLargeDesktop ? 44 : isLarge ? 38 : isWide ? 32 : 28,
                fontWeight: '800', letterSpacing: -0.5,
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
                  leftIcon={<MaterialIcons name={primaryIcon} size={18} color={theme.colors.textInverse} />}
                  style={{ flex: 1 }}
                />
              ) : null}
              {secondaryLabel && secondaryAction ? (
                <AppButton
                  title={secondaryLabel}
                  variant="secondary"
                  size="md"
                  onPress={secondaryAction}
                  textColor="#FFFFFF"
                  leftIcon={<MaterialIcons name={secondaryIcon} size={17} color="#FFFFFF" />}
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)' }}
                />
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </FadeIn>
  );
}

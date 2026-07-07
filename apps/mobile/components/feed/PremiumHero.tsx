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
import { BRAND_WORSHIP_ASSET, DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
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
  secondaryLabel, secondaryIcon = 'search',
  onPrimaryPress, onPrimary, onSecondaryPress, onSecondary,
  height,
}: PremiumHeroProps) {
  const styles = useFeedStyles();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const isWide  = device.width >= 760;
  const isLarge = device.isDesktop || device.isTV;
  const heroHeight = height ?? (device.isTV ? 540 : device.isLargeDesktop ? 480 : isLarge ? 420 : isWide ? 360 : 310);
  const imageUrl = item?.imageUrl || DEFAULT_CONTENT_IMAGE_URI;
  const primaryAction    = onPrimary ?? onPrimaryPress;
  const secondaryAction  = onSecondary ?? onSecondaryPress;
  const resolvedPrimaryLabel = primaryLabel ?? actionLabel ?? 'Play now';
  const isLiveItem = item?.isLive;

  return (
    <FadeIn delay={30} duration={500}>
      <View style={[styles.heroContainer, { height: heroHeight }]}>
        <Image source={item ? { uri: imageUrl } : BRAND_WORSHIP_ASSET} resizeMode="cover" style={common.fill} />

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
            {(isLiveItem || eyebrow || item) ? (
              <View style={[styles.heroBadge, {
                borderColor: isLiveItem ? 'rgba(244,63,94,0.5)' : 'rgba(255,255,255,0.28)',
                backgroundColor: isLiveItem ? 'rgba(244,63,94,0.18)' : 'rgba(0,0,0,0.52)',
              }]}>
                {isLiveItem ? <View style={[styles.heroBadgeDot, { backgroundColor: theme.colors.danger }]} /> : null}
                <CustomText style={{
                  color: isLiveItem ? theme.colors.danger : 'rgba(255,255,255,0.9)',
                  fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase',
                }}>
                  {isLiveItem ? 'Live now' : eyebrow ?? (item?.type === 'video' ? 'Featured video' : 'Featured')}
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
              {item?.title || title || 'Welcome to ClaudyGod'}
            </CustomText>

            {item ? (
              <CustomText style={styles.heroMetaText}>
                {[item.subtitle, isValidDuration(item.duration) ? item.duration : null].filter(Boolean).join(' · ')}
              </CustomText>
            ) : null}

            <CustomText variant="body" style={styles.heroSubtitle} numberOfLines={2}>
              {item?.description || subtitle || 'Worship, messages, live ministry, and videos.'}
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

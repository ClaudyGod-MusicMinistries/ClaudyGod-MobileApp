import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import type { FeedCardItem } from '../../services/contentService';
import { CustomText } from '../CustomText';
import { AppImage } from '../ui/AppImage';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useLocalContent } from '../../hooks/useLocalContent';
import { useToast } from '../../context/ToastContext';
import { buildPlayerRoute } from '../../util/playerRoute';
import { APP_ROUTES } from '../../util/appRoutes';
import { openExternalUrl } from '../../util/externalLinks';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { isValidDuration } from './utils';

interface LatestReleaseCardProps {
  item: FeedCardItem;
  onPlay?: (_item: FeedCardItem) => void;
  onOpenTrailer?: (_trailerUrl: string) => void;
}

export function LatestReleaseCard({ item, onPlay, onOpenTrailer }: LatestReleaseCardProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const isWide = device.isWide || device.isDesktop;
  const { showToast } = useToast();
  const { checkIsFavorited, toggleFavorite } = useLocalContent();
  const isFavorited = checkIsFavorited(item.id);

  const isUpcoming = Boolean(item.isUpcoming);
  const releaseDate = item.releaseDate;
  const trailerUrl = item.trailerUrl;

  const formattedReleaseDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const durationLabel = isValidDuration(item.duration) ? item.duration : null;

  const handlePrimaryPress = () => {
    if (isUpcoming) {
      const willFavorite = !isFavorited;
      void toggleFavorite(item);
      showToast({
        title: willFavorite ? 'Pre-saved to library' : 'Removed from saved releases',
        message: willFavorite ? 'You will be notified on official release.' : undefined,
        tone: willFavorite ? 'success' : 'info',
      });
      return;
    }

    if (onPlay) {
      onPlay(item);
    } else {
      router.push(buildPlayerRoute(item));
    }
  };

  const handleTrailerPress = () => {
    if (!trailerUrl) return;
    if (onOpenTrailer) {
      onOpenTrailer(trailerUrl);
    } else if (trailerUrl.includes('youtube.com') || trailerUrl.includes('youtu.be')) {
      void openExternalUrl(trailerUrl);
    } else {
      router.push({
        pathname: APP_ROUTES.tabs.videos,
        params: {
          mediaUrl: trailerUrl,
          title: `${item.title} (Official Trailer)`,
          subtitle: item.subtitle,
        },
      } as never);
    }
  };

  const handleToggleFavorite = () => {
    const willFavorite = !isFavorited;
    void toggleFavorite(item);
    showToast({
      title: willFavorite ? 'Saved to library' : 'Removed from library',
      tone: 'info',
    });
  };

  const accentColor = isUpcoming ? '#a855f7' : '#10b981';
  const accentBorder = isUpcoming ? 'rgba(168, 85, 247, 0.4)' : 'rgba(16, 185, 129, 0.4)';
  const accentSurface = isUpcoming ? 'rgba(168, 85, 247, 0.12)' : 'rgba(16, 185, 129, 0.12)';
  const artworkSize = isWide ? 132 : 102;

  return (
    <View style={[styles.card, { borderColor: accentBorder }]}>
      {/* Dynamic subtle ambient gradient */}
      <LinearGradient
        colors={[
          theme.colors.elevated,
          isUpcoming ? 'rgba(168, 85, 247, 0.08)' : 'rgba(16, 185, 129, 0.06)',
          theme.colors.surface,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Banner / Badge Row */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: accentSurface, borderColor: accentBorder }]}>
            <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
            <CustomText style={[styles.statusText, { color: accentColor }]}>
              {isUpcoming ? 'UPCOMING PREMIERE' : 'LATEST RELEASE'}
            </CustomText>
          </View>

          {formattedReleaseDate ? (
            <View style={[styles.metaPill, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
              <MaterialIcons name="event" size={12} color={theme.colors.textMuted} />
              <CustomText variant="caption" style={[styles.metaPillText, { color: theme.colors.textSecondary }]}>
                {formattedReleaseDate}
              </CustomText>
            </View>
          ) : null}

          {durationLabel ? (
            <View style={[styles.metaPill, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
              <MaterialIcons name="schedule" size={12} color={theme.colors.textMuted} />
              <CustomText variant="caption" style={[styles.metaPillText, { color: theme.colors.textSecondary }]}>
                {durationLabel}
              </CustomText>
            </View>
          ) : null}
        </View>

        <TVTouchable
          onPress={handleToggleFavorite}
          showFocusBorder={false}
          style={[styles.saveBtn, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}
          accessibilityLabel={isFavorited ? 'Remove from library' : 'Save to library'}
        >
          <MaterialIcons
            name={isFavorited ? 'bookmark' : 'bookmark-border'}
            size={18}
            color={isFavorited ? theme.colors.primary : theme.colors.textMuted}
          />
        </TVTouchable>
      </View>

      {/* Media & Artwork Row */}
      <View style={styles.bodyRow}>
        <View
          style={[
            styles.artworkContainer,
            {
              width: artworkSize,
              height: artworkSize,
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <AppImage
            uri={item.imageUrl}
            style={styles.artwork}
            resizeMode="cover"
          />
          {trailerUrl ? (
            <TVTouchable
              onPress={handleTrailerPress}
              showFocusBorder={false}
              style={styles.trailerBadgeOverlay}
              accessibilityLabel="Watch trailer"
            >
              <MaterialIcons name="play-circle-filled" size={13} color="#ffffff" />
              <CustomText style={styles.trailerOverlayText}>Trailer</CustomText>
            </TVTouchable>
          ) : null}
        </View>

        <View style={styles.infoCol}>
          <CustomText
            variant="title"
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: isWide ? 18.5 : 16,
                lineHeight: isWide ? 24 : 21,
              },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </CustomText>

          <View style={styles.artistRow}>
            <MaterialIcons name="verified" size={13} color={theme.colors.primary} />
            <CustomText
              variant="caption"
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.subtitle || 'ClaudyGod Music & Ministries'}
            </CustomText>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            <TVTouchable
              onPress={handlePrimaryPress}
              showFocusBorder={false}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.primary,
                },
              ]}
              accessibilityLabel={isUpcoming ? 'Pre-save premiere' : 'Play release'}
            >
              <MaterialIcons
                name={isUpcoming ? (isFavorited ? 'check' : 'notifications-active') : 'play-arrow'}
                size={18}
                color={theme.colors.onPrimary}
              />
              <CustomText style={[styles.primaryBtnText, { color: theme.colors.onPrimary }]}>
                {isUpcoming ? (isFavorited ? 'Pre-saved' : 'Pre-save') : 'Play Now'}
              </CustomText>
            </TVTouchable>

            {trailerUrl ? (
              <TVTouchable
                onPress={handleTrailerPress}
                showFocusBorder={false}
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
                accessibilityLabel="Watch official trailer video"
              >
                <MaterialIcons name="videocam" size={16} color={theme.colors.text} />
                <CustomText style={[styles.secondaryBtnText, { color: theme.colors.text }]}>
                  Watch Trailer
                </CustomText>
              </TVTouchable>
            ) : null}
          </View>
        </View>

        {/* Desktop Accent Balance on wide web screens */}
        {isWide ? (
          <View style={styles.desktopSpotlightSide}>
            <View style={styles.visualizerRow}>
              <View style={[styles.vizBar, { height: 13, backgroundColor: accentColor }]} />
              <View style={[styles.vizBar, { height: 22, backgroundColor: accentColor }]} />
              <View style={[styles.vizBar, { height: 32, backgroundColor: accentColor }]} />
              <View style={[styles.vizBar, { height: 18, backgroundColor: accentColor }]} />
              <View style={[styles.vizBar, { height: 26, backgroundColor: accentColor }]} />
              <View style={[styles.vizBar, { height: 11, backgroundColor: accentColor }]} />
            </View>
            <CustomText style={[styles.desktopSpotlightLabel, { color: theme.colors.textMuted }]}>
              {isUpcoming ? 'Exclusive Premiere' : 'Spotlight Release'}
            </CustomText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginVertical: 4,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  saveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 1,
  },
  artworkContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  trailerBadgeOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.76)',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2.5,
    paddingHorizontal: 4,
  },
  trailerOverlayText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 5,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  desktopSpotlightSide: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  visualizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 34,
  },
  vizBar: {
    width: 3.5,
    borderRadius: 2,
    opacity: 0.85,
  },
  desktopSpotlightLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import type { FeedCardItem } from '../../services/contentService';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { useAppTheme } from '../../util/colorScheme';
import { useLocalContent } from '../../hooks/useLocalContent';
import { useToast } from '../../context/ToastContext';
import { buildPlayerRoute } from '../../util/playerRoute';
import { APP_ROUTES } from '../../util/appRoutes';
import { openExternalUrl } from '../../util/externalLinks';

interface LatestReleaseCardProps {
  item: FeedCardItem;
  onPlay?: (_item: FeedCardItem) => void;
  onOpenTrailer?: (_trailerUrl: string) => void;
}

export function LatestReleaseCard({ item, onPlay, onOpenTrailer }: LatestReleaseCardProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { checkIsFavorited, toggleFavorite } = useLocalContent();
  const isFavorited = checkIsFavorited(item.id);

  const isUpcoming = Boolean(item.isUpcoming);
  const releaseDate = item.releaseDate;
  const trailerUrl = item.trailerUrl;

  const formattedReleaseDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

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

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.primaryBorder }]}>
      {/* Top Banner / Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.statusBadge,
              isUpcoming
                ? { backgroundColor: `${theme.colors.primary}25`, borderColor: theme.colors.primary }
                : { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isUpcoming ? theme.colors.primary : '#10b981' },
              ]}
            />
            <CustomText
              variant="caption"
              style={[
                styles.statusText,
                { color: isUpcoming ? theme.colors.primary : '#10b981' },
              ]}
            >
              {isUpcoming ? 'UPCOMING PREMIERE' : 'LATEST RELEASE'}
            </CustomText>
          </View>

          {formattedReleaseDate ? (
            <CustomText variant="caption" style={[styles.releaseDateText, { color: theme.colors.textSecondary }]}>
              {formattedReleaseDate}
            </CustomText>
          ) : null}
        </View>

        <TVTouchable
          onPress={handleToggleFavorite}
          showFocusBorder={false}
          style={styles.saveBtn}
          accessibilityLabel={isFavorited ? 'Remove from library' : 'Save to library'}
        >
          <MaterialIcons
            name={isFavorited ? 'bookmark' : 'bookmark-border'}
            size={20}
            color={isFavorited ? theme.colors.primary : theme.colors.textMuted}
          />
        </TVTouchable>
      </View>

      {/* Media & Artwork Row */}
      <View style={styles.bodyRow}>
        <View style={[styles.artworkContainer, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
          <Image
            source={{ uri: item.imageUrl }}
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
              <MaterialIcons name="play-circle-filled" size={14} color="#ffffff" />
              <CustomText style={styles.trailerOverlayText}>Trailer</CustomText>
            </TVTouchable>
          ) : null}
        </View>

        <View style={styles.infoCol}>
          <CustomText variant="title" style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {item.title}
          </CustomText>
          <CustomText variant="caption" style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.subtitle || 'ClaudyGod Music & Ministries'}
          </CustomText>

          {item.description ? (
            <CustomText variant="caption" style={[styles.description, { color: theme.colors.textMuted }]} numberOfLines={2}>
              {item.description}
            </CustomText>
          ) : null}

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TVTouchable
              onPress={handlePrimaryPress}
              showFocusBorder={false}
              style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
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
                style={[styles.secondaryBtn, { backgroundColor: theme.colors.subtleFill, borderColor: theme.colors.border }]}
                accessibilityLabel="Watch official trailer video"
              >
                <MaterialIcons name="videocam" size={16} color={theme.colors.text} />
                <CustomText style={[styles.secondaryBtnText, { color: theme.colors.text }]}>
                  Trailer
                </CustomText>
              </TVTouchable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  releaseDateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  artworkContainer: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  trailerBadgeOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
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
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});

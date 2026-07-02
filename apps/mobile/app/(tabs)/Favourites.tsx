import React, { useCallback, useMemo, useState } from 'react';
import { Image, Share, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../../util/colorScheme';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { useToast } from '../../context/ToastContext';
import { makeStyles } from '../../styles/makeStyles';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { FadeIn } from '../../components/ui/FadeIn';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import {
  PremiumHero,
  PremiumPage,
  SectionLabel,
} from '../../components/Exp/PremiumContent';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { FeedCardItem } from '../../services/contentService';
import { useLocalContent } from '../../hooks/useLocalContent';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  // FavCard
  favCardPad:        { flex: 1, padding: theme.spacing.sm },
  favCoverWrap:      { borderRadius: theme.radius.lg, overflow: 'hidden', aspectRatio: 1 },
  favCoverImg:       { width: '100%', height: '100%' },
  favMeta:           { marginTop: 10, gap: 4 },
  favTitle:          { color: theme.colors.text },
  favSubtitle:       { color: theme.colors.textSecondary },
  favActions:        { flexDirection: 'row', gap: 7, marginTop: 10 },
  playBtnFill:       { flex: 1 },
  iconBtn:           { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconBtnDefault:    { backgroundColor: theme.colors.subtleFill, borderColor: theme.colors.border },
  iconBtnRemoving:   { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: theme.colors.danger },

  // Empty state
  emptyCard:         { padding: theme.spacing.xl, alignItems: 'center', gap: 18 },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${theme.colors.primary}14`,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  emptyTextWrap:     { alignItems: 'center', gap: 8 },
  emptyTitle:        { color: theme.colors.text, textAlign: 'center' },
  emptyBody:         { color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 360 },
  emptyBtnsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },

  // Grid
  gridWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem:     { minWidth: 130 },

  // TypeBadge
  typeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText:{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
}));

// ─── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  const map: Record<string, { icon: React.ComponentProps<typeof MaterialIcons>['name']; color: string }> = {
    audio:    { icon: 'music-note',    color: theme.colors.primary },
    video:    { icon: 'smart-display', color: theme.colors.info    },
    live:     { icon: 'live-tv',       color: theme.colors.danger  },
    playlist: { icon: 'queue-music',   color: theme.colors.warning },
  };
  const entry = map[type] ?? { icon: 'star' as const, color: theme.colors.primary };
  return (
    <View style={[styles.typeBadge, { backgroundColor: `${entry.color}14` }]}>
      <MaterialIcons name={entry.icon} size={11} color={entry.color} />
      <CustomText variant="caption" style={[styles.typeBadgeText, { color: entry.color }]}>
        {type}
      </CustomText>
    </View>
  );
}

// ─── FavCard ──────────────────────────────────────────────────────────────────

function FavCard({
  item, onPlay, onShare, onRemove, removing,
}: {
  item: FeedCardItem;
  onPlay: () => void;
  onShare: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <SurfaceCard tone="subtle" style={styles.favCardPad}>
      <TVTouchable onPress={onPlay} showFocusBorder={false}>
        <View style={styles.favCoverWrap}>
          <Image
            source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
            style={styles.favCoverImg}
            resizeMode="cover"
          />
        </View>
      </TVTouchable>
      <View style={styles.favMeta}>
        <TypeBadge type={item.type} />
        <CustomText variant="label" style={styles.favTitle} numberOfLines={2}>{item.title}</CustomText>
        <CustomText variant="caption" style={styles.favSubtitle} numberOfLines={1}>
          {[item.subtitle, item.duration].filter(Boolean).join(' · ')}
        </CustomText>
      </View>
      <View style={styles.favActions}>
        <AppButton
          title="Play" size="sm" onPress={onPlay} style={styles.playBtnFill}
          leftIcon={<MaterialIcons name="play-arrow" size={16} color="#FFFFFF" />}
        />
        <TVTouchable onPress={onShare} showFocusBorder={false} style={[styles.iconBtn, styles.iconBtnDefault]}>
          <MaterialIcons name="ios-share" size={15} color={theme.colors.textSecondary} />
        </TVTouchable>
        <TVTouchable
          onPress={onRemove}
          showFocusBorder={false}
          style={[styles.iconBtn, removing ? styles.iconBtnRemoving : styles.iconBtnDefault]}
        >
          <MaterialIcons name="favorite" size={15} color={removing ? theme.colors.danger : theme.colors.textMuted} />
        </TVTouchable>
      </View>
    </SurfaceCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FavouritesScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const { favorites, removeFromFavorites, loaded } = useLocalContent();
  const [removingId, setRemovingId]     = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<FeedCardItem | null>(null);
  const [isRemoving, setIsRemoving]     = useState(false);

  const featured   = favorites[0] ?? null;
  const numCols    = device.isTV ? 5 : device.isLargeDesktop ? 4 : device.isDesktop ? 3 : device.isTablet ? 3 : 2;
  const colPercent = `${Math.floor(100 / numCols) - 1}%` as const;
  const gridItems  = useMemo(() => favorites.slice(featured ? 1 : 0), [favorites, featured]);

  const openItem = async (item: FeedCardItem) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source: 'favourites' });
    router.push(buildPlayerRoute(item));
  };

  const shareItem = async (item: FeedCardItem) => {
    try {
      await Share.share({ message: `${item.title}\n${item.subtitle}${item.mediaUrl ? `\n${item.mediaUrl}` : ''}` });
    } catch {
      showToast({ title: 'Share unavailable', message: 'Please try again.', tone: 'warning' });
    }
  };

  const confirmRemove = useCallback((item: FeedCardItem) => {
    setRemoveTarget(item);
  }, []);

  const removeItem = async () => {
    if (!removeTarget) return;
    const item = removeTarget;
    setIsRemoving(true);
    setRemovingId(item.id);
    try {
      await removeFromFavorites(item.id);
      showToast({ title: 'Removed from favourites', message: item.title, tone: 'info' });
    } catch {
      showToast({ title: 'Could not remove item', message: 'Please try again.', tone: 'warning' });
    }
    setIsRemoving(false);
    setRemovingId(null);
    setRemoveTarget(null);
  };

  return (
    <>
      <PremiumPage title="Favourites" eyebrow="Saved by you" noBack refreshing={!loaded}>
        {/* Empty state */}
        {loaded && favorites.length === 0 ? (
          <SurfaceCard tone="strong" style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <MaterialIcons name="favorite-border" size={34} color={theme.colors.primary} />
            </View>
            <View style={styles.emptyTextWrap}>
              <CustomText variant="heading" style={styles.emptyTitle}>No favourites yet</CustomText>
              <CustomText variant="body" style={styles.emptyBody}>
                Tap the heart on songs, videos, and sessions to keep them here.
              </CustomText>
            </View>
            <View style={styles.emptyBtnsRow}>
              <AppButton title="Discover content" size="md" onPress={() => router.push(APP_ROUTES.tabs.search)} leftIcon={<MaterialIcons name="search" size={17} color={theme.colors.textInverse} />} />
              <AppButton title="Browse music" size="md" variant="secondary" onPress={() => router.push(APP_ROUTES.tabs.player)} leftIcon={<MaterialIcons name="graphic-eq" size={17} color={theme.colors.text} />} />
            </View>
          </SurfaceCard>
        ) : null}

        {/* Featured hero */}
        {featured ? (
          <FadeIn delay={70}>
            <PremiumHero
              item={featured}
              title={featured.title}
              subtitle={featured.description || featured.subtitle || ''}
              eyebrow="Top favourite"
              primaryLabel="Play now"
              primaryIcon="play-arrow"
              onPrimary={() => void openItem(featured)}
            />
          </FadeIn>
        ) : null}

        {/* Count summary */}
        {favorites.length > 1 ? (
          <FadeIn delay={110}>
            <SectionLabel title="All favourites" accent={`${favorites.length} saved`} subtitle="Your complete favourites collection" />
          </FadeIn>
        ) : null}

        {/* Responsive grid */}
        {gridItems.length > 0 ? (
          <FadeIn delay={140}>
            <View style={styles.gridWrap}>
              {gridItems.map((item) => (
                <View key={item.id} style={[styles.gridItem, { width: colPercent }]}>
                  <FavCard
                    item={item}
                    onPlay={() => void openItem(item)}
                    onShare={() => void shareItem(item)}
                    onRemove={() => confirmRemove(item)}
                    removing={removingId === item.id}
                  />
                </View>
              ))}
            </View>
          </FadeIn>
        ) : null}
      </PremiumPage>

      <ConfirmModal
        visible={Boolean(removeTarget)}
        icon="favorite"
        title="Remove from favourites?"
        body={removeTarget ? `"${removeTarget.title}" will be removed from your saved items.` : undefined}
        primaryLabel="Remove"
        primaryTone="danger"
        secondaryLabel="Keep it"
        loading={isRemoving}
        onPrimary={() => { void removeItem(); }}
        onDismiss={() => { if (!isRemoving) setRemoveTarget(null); }}
      />
    </>
  );
}

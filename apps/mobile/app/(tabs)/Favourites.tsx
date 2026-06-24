import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Share, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../../util/colorScheme';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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
import {
  fetchMeLibrary,
  removeMeLibraryItem,
  type MeLibraryItem,
} from '../../services/userFlowService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { FeedCardItem } from '../../services/contentService';
import { useGuestSession } from '../../hooks/useGuestSession';

function toFeedItem(item: MeLibraryItem): FeedCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle || 'ClaudyGod',
    description: item.description || '',
    duration: item.duration || '--:--',
    imageUrl: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI,
    mediaUrl: item.mediaUrl,
    type: item.type,
    createdAt: item.createdAt,
  };
}

function TypeBadge({ type }: { type: string }) {
  const theme = useAppTheme();
  const map: Record<string, { icon: React.ComponentProps<typeof MaterialIcons>['name']; color: string }> = {
    audio:    { icon: 'music-note',    color: theme.colors.primary },
    video:    { icon: 'smart-display', color: theme.colors.info    },
    live:     { icon: 'live-tv',       color: theme.colors.danger  },
    playlist: { icon: 'queue-music',   color: theme.colors.warning },
  };
  const entry = map[type] ?? { icon: 'star', color: theme.colors.primary };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${entry.color}14`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
      <MaterialIcons name={entry.icon} size={11} color={entry.color} />
      <CustomText variant="caption" style={{ color: entry.color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {type}
      </CustomText>
    </View>
  );
}

function FavCard({
  item,
  onPlay,
  onShare,
  onRemove,
  removing,
}: {
  item: FeedCardItem;
  onPlay: () => void;
  onShare: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const theme = useAppTheme();
  return (
    <SurfaceCard tone="subtle" style={{ flex: 1, padding: theme.spacing.sm }}>
      <TVTouchable onPress={onPlay} showFocusBorder={false}>
        <View style={{ borderRadius: theme.radius.lg, overflow: 'hidden', aspectRatio: 1 }}>
          <Image
            source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      </TVTouchable>
      <View style={{ marginTop: 10, gap: 4 }}>
        <TypeBadge type={item.type} />
        <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={2}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.textSecondary }} numberOfLines={1}>
          {[item.subtitle, item.duration].filter(Boolean).join(' · ')}
        </CustomText>
      </View>
      <View style={{ flexDirection: 'row', gap: 7, marginTop: 10 }}>
        <AppButton title="Play" size="sm" onPress={onPlay} style={{ flex: 1 }} leftIcon={<MaterialIcons name="play-arrow" size={16} color="#FFFFFF" />} />
        <TVTouchable
          onPress={onShare}
          showFocusBorder={false}
          style={{
            width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            borderWidth: 1, borderColor: theme.colors.border,
          }}
        >
          <MaterialIcons name="ios-share" size={15} color={theme.colors.textSecondary} />
        </TVTouchable>
        <TVTouchable
          onPress={onRemove}
          showFocusBorder={false}
          style={{
            width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
            backgroundColor: removing ? 'rgba(239,68,68,0.08)' : 'transparent',
            borderWidth: 1, borderColor: removing ? theme.colors.danger : theme.colors.border,
          }}
        >
          <MaterialIcons name="favorite" size={15} color={removing ? theme.colors.danger : theme.colors.textMuted} />
        </TVTouchable>
      </View>
    </SurfaceCard>
  );
}

export default function FavouritesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { guestFavorites, removeFavorite: removeGuestFav, loaded: guestLoaded } = useGuestSession();
  const [items, setItems] = useState<FeedCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<FeedCardItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadFavourites = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const library = await fetchMeLibrary();
      setItems(library.liked.map(toFeedItem));
    } catch {
      showToast({ title: 'Favourites unavailable', message: 'Please check your connection and try again.', tone: 'warning' });
    }
    setLoading(false);
  }, [isAuthenticated, showToast]);

  useEffect(() => { void loadFavourites(); }, [loadFavourites]);

  const featured = items[0] ?? null;
  const gridItems = useMemo(() => items.slice(featured ? 1 : 0), [featured, items]);
  const numCols = device.isTV ? 5 : device.isLargeDesktop ? 4 : device.isDesktop ? 3 : device.isTablet ? 3 : 2;
  const colPercent = `${Math.floor(100 / numCols) - 1}%` as const;

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

  const confirmRemove = (item: FeedCardItem) => {
    setRemoveTarget(item);
  };

  const removeItem = async () => {
    if (!removeTarget) return;
    const item = removeTarget;
    setIsRemoving(true);
    setRemovingId(item.id);
    try {
      if (isAuthenticated) {
        await removeMeLibraryItem({ bucket: 'liked', contentId: item.id });
        setItems((current) => current.filter((entry) => entry.id !== item.id));
      } else {
        await removeGuestFav(item.id);
      }
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
    <PremiumPage
      title="Favourites"
      eyebrow="Saved by you"
      noBack
      refreshing={loading}
      onRefresh={() => void loadFavourites()}
    >
      {/* Guest: sync banner + local favourites */}
      {!isAuthenticated && guestLoaded ? (
        <>
          {/* Sign-in sync strip */}
          <TVTouchable
            onPress={() => router.push(APP_ROUTES.auth.signIn)}
            showFocusBorder={false}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: `${theme.colors.primary}14`,
              borderWidth: 1, borderColor: `${theme.colors.primary}30`,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: 12,
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}20` }}>
              <MaterialIcons name="sync" size={16} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText variant="label" style={{ color: theme.colors.text }}>
                Sign in to sync across devices
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
                Your saved items will transfer automatically when you sign in.
              </CustomText>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={theme.colors.primary} />
          </TVTouchable>

          {/* Guest has no local favourites yet */}
          {guestFavorites.length === 0 ? (
            <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, alignItems: 'center', gap: 18 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}14`, borderWidth: 1, borderColor: theme.colors.border }}>
                <MaterialIcons name="favorite-border" size={34} color={theme.colors.primary} />
              </View>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <CustomText variant="heading" style={{ color: theme.colors.text, textAlign: 'center' }}>
                  No favourites yet
                </CustomText>
                <CustomText variant="body" style={{ color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 360 }}>
                  Tap the heart on songs, videos, and sessions to save them here even without an account.
                </CustomText>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                <AppButton title="Discover content" size="md" onPress={() => router.push(APP_ROUTES.tabs.search)} leftIcon={<MaterialIcons name="search" size={17} color={theme.colors.textInverse} />} />
                <AppButton title="Browse music" size="md" variant="secondary" onPress={() => router.push(APP_ROUTES.tabs.player)} leftIcon={<MaterialIcons name="graphic-eq" size={17} color={theme.colors.text} />} />
              </View>
            </SurfaceCard>
          ) : null}

          {/* Guest grid using local storage */}
          {guestFavorites.length > 0 ? (
            <FadeIn>
              <SectionLabel
                title="Saved locally"
                accent={`${guestFavorites.length} items`}
                subtitle="Syncs to your account when you sign in"
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
                {guestFavorites.map((item) => (
                  <View key={item.id} style={{ width: colPercent, minWidth: 130 }}>
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
        </>
      ) : null}

      {/* Authenticated empty state */}
      {!loading && isAuthenticated && !items.length ? (
        <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, alignItems: 'center', gap: 18 }}>
          <View
            style={{
              width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
              backgroundColor: `${theme.colors.primary}14`, borderWidth: 1, borderColor: theme.colors.border,
            }}
          >
            <MaterialIcons name="favorite-border" size={34} color={theme.colors.primary} />
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <CustomText variant="heading" style={{ color: theme.colors.text, textAlign: 'center' }}>
              No favourites yet
            </CustomText>
            <CustomText variant="body" style={{ color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 360 }}>
              Tap the save button on songs, videos, and live sessions to keep them here.
            </CustomText>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            <AppButton title="Discover content" size="md" onPress={() => router.push(APP_ROUTES.tabs.search)} leftIcon={<MaterialIcons name="search" size={17} color={theme.colors.textInverse} />} />
            <AppButton title="Go home" size="md" variant="secondary" onPress={() => router.push(APP_ROUTES.tabs.home)} leftIcon={<MaterialIcons name="home-filled" size={17} color={theme.colors.text} />} />
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
      {items.length > 1 ? (
        <FadeIn delay={110}>
          <SectionLabel
            title="All favourites"
            accent={`${items.length} saved`}
            subtitle="Your complete favourites collection"
          />
        </FadeIn>
      ) : null}

      {/* Responsive grid */}
      {gridItems.length > 0 ? (
        <FadeIn delay={140}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {gridItems.map((item) => (
              <View key={item.id} style={{ width: colPercent, minWidth: 130 }}>
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
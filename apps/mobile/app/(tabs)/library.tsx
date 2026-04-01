import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { PosterCard } from '../../components/ui/PosterCard';
import { ActionSheet, type ActionSheetAction } from '../../components/ui/ActionSheet';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { Chip } from '../../components/ui/Chip';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import type { FeedCardItem } from '../../services/contentService';
import { APP_ROUTES, TAB_ROUTE_BY_ID } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchMeLibrary, saveMeLibraryItem, type MeLibrary, type MeLibraryItem } from '../../services/userFlowService';
import { getLibraryLayoutSections, type MobileLayoutSection } from '../../util/mobileLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LIBRARY_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'saved', label: 'Saved' },
  { key: 'downloads', label: 'Downloads' },
  { key: 'playlists', label: 'Playlists' },
] as const;

function toFeedCardItem(item: MeLibraryItem): FeedCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    duration: item.duration || '--:--',
    imageUrl: item.imageUrl || '',
    mediaUrl: item.mediaUrl,
    type: item.type,
    createdAt: item.createdAt,
  };
}

function buildPlaylistCards(playlists: MeLibrary['playlists']): FeedCardItem[] {
  return playlists.map((playlist, index) => {
    const seed = playlist.items[0];
    return {
      id: `playlist:${playlist.name}:${index}`,
      title: playlist.name,
      subtitle: `${playlist.items.length} saved item${playlist.items.length === 1 ? '' : 's'}`,
      description: seed?.description || 'Saved listening gathered inside your library.',
      duration: seed?.duration || '--:--',
      imageUrl: seed?.imageUrl || '',
      mediaUrl: seed?.mediaUrl,
      type: 'playlist',
      createdAt: seed?.createdAt,
    };
  });
}

function dedupeItems(items: FeedCardItem[]): FeedCardItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.mediaUrl?.trim() ? `media:${item.mediaUrl.trim()}` : `id:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function PickedForYouCard({
  item,
  onPress,
  onMorePress,
}: {
  item: FeedCardItem;
  onPress: () => void;
  onMorePress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Image source={{ uri: item.imageUrl }} style={{ width: 96, height: 96, borderRadius: theme.radius.md }} />
        <View style={{ flex: 1, gap: 4 }}>
          <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
            {item.duration ?? item.subtitle ?? 'ClaudyGod'}
          </CustomText>
          <CustomText variant="label" style={{ color: theme.colors.text }}>
            {item.title}
          </CustomText>
          {item.description ? (
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary }} numberOfLines={2}>
              {item.description}
            </CustomText>
          ) : null}
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <TVTouchable onPress={onMorePress} showFocusBorder={false}>
            <MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} />
          </TVTouchable>
          <TVTouchable
            onPress={onPress}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            showFocusBorder={false}
          >
            <MaterialIcons name="play-arrow" size={20} color={theme.colors.textInverse} />
          </TVTouchable>
        </View>
      </View>
    </SurfaceCard>
  );
}

function RotationRow({
  item,
  onPress,
  onMorePress,
}: {
  item: FeedCardItem;
  onPress: () => void;
  onMorePress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: 44, height: 44, borderRadius: theme.radius.md }} />
      <View style={{ flex: 1 }}>
        <CustomText variant="label" style={{ color: theme.colors.text }} numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.textSecondary }} numberOfLines={1}>
          {item.subtitle ?? 'ClaudyGod'}
        </CustomText>
      </View>
      <TVTouchable onPress={onMorePress} showFocusBorder={false}>
        <MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} />
      </TVTouchable>
    </TVTouchable>
  );
}

function QuickPickCard({
  item,
  onPress,
  width,
}: {
  item: FeedCardItem;
  onPress: () => void;
  width: string;
}) {
  const theme = useAppTheme();

  return (
    <TVTouchable
      onPress={onPress}
      style={{
        width,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      showFocusBorder={false}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: 44, height: 44, borderRadius: theme.radius.md }} />
      <CustomText variant="caption" style={{ color: theme.colors.text }} numberOfLines={2}>
        {item.title}
      </CustomText>
    </TVTouchable>
  );
}

function deriveLibraryItems(
  section: MobileLayoutSection,
  params: {
    liked: FeedCardItem[];
    downloaded: FeedCardItem[];
    playlists: FeedCardItem[];
    fallback: FeedCardItem[];
  },
): FeedCardItem[] {
  const token = `${section.id} ${section.title}`.toLowerCase();
  if (token.includes('most-played')) {
    return params.liked.slice(0, section.maxItems);
  }
  if (token.includes('saved') || token.includes('music')) {
    return params.downloaded.slice(0, section.maxItems);
  }
  if (token.includes('playlist')) {
    return params.playlists.slice(0, section.maxItems);
  }

  return params.fallback
    .filter(
      (item) =>
        item.type !== 'ad' &&
        section.contentTypes.includes(item.type),
    )
    .slice(0, section.maxItems);
}

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const posterSize = isTablet ? 'md' : 'sm';
  const [activeChip, setActiveChip] = useState(LIBRARY_CHIPS[0].key);
  const formatMeta = (item: FeedCardItem) =>
    [item.subtitle, item.duration].filter((value) => Boolean(value)).join(' · ');
  const { feed } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();
  const [library, setLibrary] = useState<MeLibrary | null>(null);
  const [activeActionItem, setActiveActionItem] = useState<FeedCardItem | null>(null);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

  useEffect(() => {
    let active = true;

    if (!isAuthenticated) {
      setLibrary(null);
      return () => {
        active = false;
      };
    }

    void fetchMeLibrary()
      .then((response) => {
        if (!active) return;
        setLibrary(response);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const liked = useMemo(
    () => (library?.liked.length ? library.liked.map(toFeedCardItem) : feed.mostPlayed),
    [library?.liked, feed.mostPlayed],
  );
  const downloaded = useMemo(
    () => (library?.downloaded.length ? library.downloaded.map(toFeedCardItem) : feed.music),
    [library?.downloaded, feed.music],
  );
  const playlists = useMemo(
    () => (library?.playlists.length ? buildPlaylistCards(library.playlists) : feed.playlists),
    [library?.playlists, feed.playlists],
  );
  const fallbackPool = useMemo(
    () => dedupeItems([...liked, ...downloaded, ...playlists, ...feed.recent, ...feed.playlists]),
    [downloaded, feed.playlists, feed.recent, liked, playlists],
  );
  const librarySections = useMemo(() => getLibraryLayoutSections(mobileConfig), [mobileConfig]);
  const quickPicks = useMemo(() => dedupeItems([...liked, ...downloaded, ...playlists]).slice(0, 4), [downloaded, liked, playlists]);
  const pickedItem = useMemo(
    () => liked[0] ?? downloaded[0] ?? playlists[0] ?? fallbackPool[0] ?? null,
    [downloaded, fallbackPool, liked, playlists],
  );
  const rotationItems = useMemo(
    () => (downloaded.length ? downloaded : liked).slice(0, 3),
    [downloaded, liked],
  );
  const filteredByChip = useMemo(() => {
    if (activeChip === 'saved') return liked;
    if (activeChip === 'downloads') return downloaded;
    if (activeChip === 'playlists') return playlists;
    return fallbackPool;
  }, [activeChip, downloaded, fallbackPool, liked, playlists]);

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source,
    });
    router.push(buildPlayerRoute(item));
  };

  const openMoreForItem = (item: FeedCardItem) => {
    setActiveActionItem(item);
    setIsActionSheetVisible(true);
  };

  const shareActive = async () => {
    if (!activeActionItem) return;
    try {
      await Share.share({
        message: `${activeActionItem.title}\n${activeActionItem.subtitle}${activeActionItem.mediaUrl ? `\n${activeActionItem.mediaUrl}` : ''}`,
      });
    } catch {
      showToast({
        title: 'Share unavailable',
        message: 'Try again in a moment.',
        tone: 'warning',
      });
    }
  };

  const listenLater = async () => {
    if (!activeActionItem) return;
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in to save',
        message: 'Create an account to use Listen Later.',
        tone: 'warning',
      });
      return;
    }
    try {
      await saveMeLibraryItem({
        bucket: 'playlist',
        playlistName: 'Listen Later',
        contentId: activeActionItem.id,
        contentType: activeActionItem.type,
        title: activeActionItem.title,
        subtitle: activeActionItem.subtitle,
        description: activeActionItem.description,
        imageUrl: activeActionItem.imageUrl,
        mediaUrl: activeActionItem.mediaUrl,
        duration: activeActionItem.duration,
        metadata: { source: 'library_action_sheet' },
      });
      showToast({
        title: 'Added to Listen Later',
        message: 'We saved this for you.',
        tone: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Listen later unavailable',
        message: error instanceof Error ? error.message : 'Please try again.',
        tone: 'warning',
      });
    }
  };

  const openReviews = () => {
    router.push(APP_ROUTES.settingsPages.rate);
  };

  const actionSheetActions: ActionSheetAction[] = !activeActionItem
    ? []
    : [
        {
          key: 'share',
          label: 'Share',
          detail: 'Send this item to someone else.',
          icon: 'ios-share',
          onPress: () => void shareActive(),
        },
        {
          key: 'listen-later',
          label: 'Listen Later',
          detail: 'Save this for later.',
          icon: 'schedule',
          onPress: () => void listenLater(),
        },
        {
          key: 'reviews',
          label: 'Reviews & Ratings',
          detail: 'See what others are saying.',
          icon: 'reviews',
          onPress: openReviews,
        },
        {
          key: 'open-detail',
          label: 'Open Player',
          detail: 'Open the full player screen.',
          icon: 'open-in-full',
          tone: 'accent' as const,
          onPress: () => {
            router.push(buildPlayerRoute(activeActionItem));
          },
        },
      ];

  if (!isAuthenticated) {
    const guestPreview = dedupeItems([...feed.mostPlayed, ...feed.music, ...feed.videos, ...feed.recent]).slice(0, 10);

    return (
      <TabScreenWrapper>
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Screen>
            <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge }}>
              <FadeIn>
                <BrandedHeaderCard
                  title="Library"
                  subtitle="Save worship tracks, replays, and playlists to your personal space."
                  actions={[
                    { icon: 'search', onPress: () => router.push(APP_ROUTES.tabs.search), accessibilityLabel: 'Search' },
                  ]}
                />
              </FadeIn>

              <FadeIn delay={60}>
                <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
                  <View style={{ gap: 12 }}>
                    <View style={{ gap: 6 }}>
                      <CustomText
                        variant="caption"
                        style={{
                          color: theme.colors.textSecondary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                        }}
                      >
                        Personal library
                      </CustomText>
                      <CustomText variant="heading" style={{ color: theme.colors.text }}>
                        Sign in to save what matters
                      </CustomText>
                      <CustomText variant="body" style={{ color: theme.colors.textSecondary }}>
                        Keep your music, video replays, playlists, and history in one place across devices.
                      </CustomText>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <AppButton
                        title="Create Account"
                        size="sm"
                        onPress={() => router.push(APP_ROUTES.auth.signUp)}
                      />
                      <AppButton
                        title="Sign In"
                        variant="secondary"
                        size="sm"
                        onPress={() => router.push(APP_ROUTES.auth.signIn)}
                      />
                    </View>
                  </View>
                </SurfaceCard>
              </FadeIn>

              {guestPreview.length ? (
                <>
                  <FadeIn delay={90}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                      bounces={false}
                      overScrollMode="never"
                    >
                      {LIBRARY_CHIPS.map((chip) => (
                        <Chip
                          key={chip.key}
                          label={chip.label}
                          active={activeChip === chip.key}
                          onPress={() => setActiveChip(chip.key)}
                        />
                      ))}
                    </ScrollView>
                  </FadeIn>

                  <FadeIn delay={110}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {guestPreview.slice(0, 4).map((item) => (
                        <QuickPickCard
                          key={`guest-quick-${item.id}`}
                          item={item}
                          width={isTablet ? '31.8%' : '48%'}
                          onPress={() => void openItem(item, 'library_guest_quick_pick')}
                        />
                      ))}
                    </View>
                  </FadeIn>

                  <FadeIn delay={120}>
                    <View style={{ gap: 10 }}>
                      <CustomText variant="heading" style={{ color: theme.colors.text }}>
                        Picked for you
                      </CustomText>
                      <PickedForYouCard
                        item={guestPreview[0]}
                        onPress={() => void openItem(guestPreview[0], 'library_guest_picked')}
                        onMorePress={() => openMoreForItem(guestPreview[0])}
                      />
                    </View>
                  </FadeIn>

                  <FadeIn delay={140}>
                    <View style={{ gap: 10 }}>
                      <SectionHeader
                        title="Your recent rotation"
                        actionLabel="Home"
                        onAction={() => router.push(APP_ROUTES.tabs.home)}
                      />
                      <View style={{ gap: 2 }}>
                        {guestPreview.slice(0, 3).map((item) => (
                          <RotationRow
                            key={`guest-rotation-${item.id}`}
                            item={item}
                            onPress={() => void openItem(item, 'library_guest_rotation')}
                            onMorePress={() => openMoreForItem(item)}
                          />
                        ))}
                      </View>
                    </View>
                  </FadeIn>

                  <FadeIn delay={160}>
                    <View>
                      <SectionHeader
                        title="Recents"
                        actionLabel="Show all"
                        onAction={() => router.push(APP_ROUTES.tabs.home)}
                      />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                        {guestPreview.slice(0, 12).map((item) => (
                          <PosterCard
                            key={`guest-library-${item.id}`}
                            imageUrl={item.imageUrl}
                            title={item.title}
                            meta={formatMeta(item)}
                            size={posterSize}
                            onPress={() => void openItem(item, 'library_guest_preview')}
                            showMore
                            onMorePress={() => openMoreForItem(item)}
                          />
                        ))}
                      </ScrollView>
                    </View>
                  </FadeIn>
                </>
              ) : null}
            </View>
          </Screen>
        </ScrollView>
      </TabScreenWrapper>
    );
  }

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge }}>
            <FadeIn>
              <BrandedHeaderCard
                title="Library"
                subtitle="Saved listening, playlists, and recent picks."
                actions={[
                  { icon: 'search', onPress: () => router.push(APP_ROUTES.tabs.search), accessibilityLabel: 'Search' },
                ]}
              />
            </FadeIn>

            <FadeIn delay={70}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                bounces={false}
                overScrollMode="never"
              >
                {LIBRARY_CHIPS.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    active={activeChip === chip.key}
                    onPress={() => setActiveChip(chip.key)}
                  />
                ))}
              </ScrollView>
            </FadeIn>

            {quickPicks.length ? (
              <FadeIn delay={90}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {quickPicks.map((item) => (
                    <QuickPickCard
                      key={`quick-${item.id}`}
                      item={item}
                      width={isTablet ? '31.8%' : '48%'}
                      onPress={() => void openItem(item, 'library_quick_pick')}
                    />
                  ))}
                </View>
              </FadeIn>
            ) : null}

            {pickedItem ? (
              <FadeIn delay={110}>
                <View style={{ gap: 10 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text }}>
                    Picked for you
                  </CustomText>
                  <PickedForYouCard
                    item={pickedItem}
                    onPress={() => void openItem(pickedItem, 'library_picked')}
                    onMorePress={() => openMoreForItem(pickedItem)}
                  />
                </View>
              </FadeIn>
            ) : null}

            {rotationItems.length ? (
              <FadeIn delay={130}>
                <View style={{ gap: 10 }}>
                  <SectionHeader
                    title="Your recent rotation"
                    actionLabel="See all"
                    onAction={() => router.push(APP_ROUTES.tabs.library)}
                  />
                  <View style={{ gap: 2 }}>
                    {rotationItems.map((item) => (
                      <RotationRow
                        key={`rotation-${item.id}`}
                        item={item}
                        onPress={() => void openItem(item, 'library_rotation')}
                        onMorePress={() => openMoreForItem(item)}
                      />
                    ))}
                  </View>
                </View>
              </FadeIn>
            ) : null}

            <FadeIn delay={150}>
              <View>
                <SectionHeader
                  title="Recents"
                  actionLabel="Show all"
                  onAction={() => router.push(APP_ROUTES.tabs.library)}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                  {filteredByChip.slice(0, 12).map((item) => (
                    <PosterCard
                      key={`recent-${item.id}`}
                      imageUrl={item.imageUrl}
                      title={item.title}
                      meta={formatMeta(item)}
                      size={posterSize}
                      onPress={() => void openItem(item, 'library_recents')}
                      showMore
                      onMorePress={() => openMoreForItem(item)}
                    />
                  ))}
                </ScrollView>
              </View>
            </FadeIn>

            <FadeIn delay={170}>
              <SurfaceCard tone="strong" style={{ padding: theme.spacing.lg }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <StatCard label="Most played" value={liked.length} />
                  <StatCard label="Saved audio" value={downloaded.length} />
                  <StatCard label="Playlists" value={playlists.length} />
                </View>
              </SurfaceCard>
            </FadeIn>

            {librarySections.map((section, index) => {
              const items = deriveLibraryItems(section, {
                liked,
                downloaded,
                playlists,
                fallback: fallbackPool,
              });

              if (!items.length) {
                return null;
              }

              return (
                <FadeIn key={section.id} delay={100 + index * 40}>
                  <View>
                    <SectionHeader
                      title={section.title}
                      actionLabel={section.actionLabel}
                      onAction={() => router.push(TAB_ROUTE_BY_ID[section.destinationTab])}
                    />
                    {isTablet ? (
                      <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>
                        {section.subtitle}
                      </CustomText>
                    ) : null}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never">
                      {items.map((item) => (
                        <PosterCard
                          key={`${section.id}-${item.id}`}
                          imageUrl={item.imageUrl}
                          title={item.title}
                          meta={formatMeta(item)}
                          size={posterSize}
                          onPress={() => void openItem(item, `library_${section.id}`)}
                          showMore
                          onMorePress={() => openMoreForItem(item)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </FadeIn>
              );
            })}
          </View>
        </Screen>
      </ScrollView>
      <ActionSheet
        visible={isActionSheetVisible}
        title={activeActionItem?.title ?? 'Content options'}
        description={activeActionItem?.subtitle}
        actions={actionSheetActions}
        onClose={() => setIsActionSheetVisible(false)}
      />
    </TabScreenWrapper>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        paddingHorizontal: 12,
        paddingVertical: 14,
      }}
    >
      <CustomText
        variant="caption"
        style={{
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </CustomText>
      <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 6 }}>
        {value}
      </CustomText>
    </View>
  );
}

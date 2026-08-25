import React, { useCallback, useMemo, useState } from 'react';
import { Image, Share, View } from 'react-native';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { FadeIn } from '../../components/ui/FadeIn';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useAppTheme } from '../../util/colorScheme';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { makeStyles } from '../../styles/makeStyles';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { getLibraryLayoutSections, deriveLayoutSectionItems } from '../../util/mobileLayout';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../context/ToastContext';
import { useLocalContent } from '../../hooks/useLocalContent';
import { useDownloads } from '../../context/DownloadsContext';
import type { FeedCardItem, ContentType } from '../../services/contentService';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackContentPlay } from '../../services/supabaseAnalytics';
import { BRAND_LOGO_ASSET, DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { useAuth } from '../../features/auth/AuthContext';
import { clearInstallationPlaybackHistory, resetRecommendationHistory } from '../../services/userFlowService';
import {
  ContentList,
  FavoriteCard,
  PremiumHero,
  PremiumPage,
  SectionLabel,
  dedupeFeedItems,
} from '../../components/feed';

type LibTab = 'saved' | 'history' | 'downloads';

const TABS: { id: LibTab; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
  { id: 'saved',     label: 'Saved',     icon: 'bookmark' },
  { id: 'history',   label: 'History',   icon: 'history' },
  { id: 'downloads', label: 'Downloads', icon: 'download-done' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  overviewCard: {
    padding: theme.spacing.lg, gap: theme.spacing.lg,
    borderColor: theme.colors.primaryBorder,
    ...theme.shadows.md,
  },
  overviewTop: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.md },
  overviewIcon: {
    width: 56, height: 56, borderRadius: theme.radius.xl,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
  },
  overviewLogo: { width: 38, height: 38, borderRadius: theme.radius.lg },
  overviewCopy: { flex: 1, minWidth: 0 },
  overviewTitle: { color: theme.colors.text, marginTop: theme.spacing.xxs },
  overviewSubtitle: { color: theme.colors.textSecondary, marginTop: theme.spacing.xs, lineHeight: 19 },
  overviewStatus: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill, backgroundColor: theme.colors.successSurface,
    borderWidth: 1, borderColor: theme.colors.successBorder,
    marginLeft: 'auto',
  },
  overviewStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.success },
  overviewStatusText: { color: theme.colors.success, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row', gap: theme.spacing.xs, padding: theme.spacing.xxs,
    borderRadius: theme.radius.xl, backgroundColor: theme.colors.subtleFill,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  tabBtn:         { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.xs, borderRadius: theme.radius.lg, borderWidth: 1 },
  tabBtnActive:   { backgroundColor: theme.colors.controlSelectedSurface, borderColor: theme.colors.controlSelectedBorder },
  tabBtnInactive: { backgroundColor: 'transparent', borderColor: 'transparent' },
  tabLabel:       { fontSize: 12.5 },
  tabLabelActive: { fontWeight: '700', color: theme.colors.controlSelectedText },
  tabLabelInactive:{ fontWeight: '500', color: theme.colors.textMuted },
  badgeWrap:      { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeActive:    { backgroundColor: theme.colors.controlSelectedIconSurface },
  badgeInactive:  { backgroundColor: theme.colors.subtleFillStrong },
  badgeText:      { fontSize: 9, fontWeight: '700' },
  badgeTextActive:{ color: theme.colors.controlSelectedText },
  badgeTextInactive: { color: theme.colors.primary },
  sectionGap:     { gap: 12 },
  collectionSection: { gap: theme.layout.sectionGap },

  // Saved-tab empty state (ported from the former Favourites screen)
  emptyCard:         { padding: theme.spacing.xl, alignItems: 'center', gap: 18 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: theme.radius.xxl,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1.5, borderColor: theme.colors.primaryBorder,
  },
  emptyLogo: { width: 48, height: 48, borderRadius: theme.radius.xl },
  emptyTextWrap:     { alignItems: 'center', gap: 8 },
  emptyTitle:        { color: theme.colors.text, textAlign: 'center' },
  emptyBody:         { color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 360 },
  emptyActions:      { gap: theme.spacing.sm, alignSelf: 'stretch' },

  // Saved-tab responsive grid
  gridWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem:     { minWidth: 130 },

  // Downloads-in-progress rows
  downloadingCard: { padding: theme.spacing.md, gap: 10 },
  downloadingRow:  { gap: 6 },
  downloadingTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  downloadingTitle:{ color: theme.colors.text, flexShrink: 1 },
  downloadingPct:  { color: theme.colors.textMuted },
  progressTrack:   { height: 4, borderRadius: 2, backgroundColor: theme.colors.subtleFill, overflow: 'hidden' },
  progressFill:    { height: 4, borderRadius: 2, backgroundColor: theme.colors.primary },
  collectionHero: {
    padding: theme.spacing.lg, gap: theme.spacing.md,
    borderColor: theme.colors.primaryBorder,
    ...theme.shadows.sm,
  },
  collectionHeroTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  collectionHeroIcon: {
    width: 48, height: 48, borderRadius: theme.radius.xl,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
  },
  collectionHeroCopy: { flex: 1, minWidth: 0 },
  collectionEyebrow: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  collectionTitle: { color: theme.colors.text, marginTop: theme.spacing.xxs },
  collectionBody: { color: theme.colors.textSecondary, marginTop: theme.spacing.xs, lineHeight: 19 },
  collectionMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  collectionMeta: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill, backgroundColor: theme.colors.subtleFill,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  collectionMetaText: { color: theme.colors.textSecondary, fontWeight: '600' },
  dangerMetaText: { color: theme.colors.danger },
  mediaList: { gap: theme.spacing.sm },
  mediaRow: { padding: theme.spacing.sm, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  mediaArtwork: { width: 76, height: 76, borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt },
  mediaImage: { width: '100%', height: '100%' },
  mediaPlay: {
    position: 'absolute', right: 6, bottom: 6,
    width: 28, height: 28, borderRadius: theme.radius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.mediaControl,
    borderWidth: 1, borderColor: theme.colors.mediaBorder,
  },
  mediaCopy: { flex: 1, minWidth: 0 },
  mediaTypeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.xxs },
  mediaType: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  mediaTitle: { color: theme.colors.text },
  mediaSubtitle: { color: theme.colors.textSecondary, marginTop: theme.spacing.xxs },
  mediaDuration: { color: theme.colors.textMuted, marginTop: theme.spacing.xxs },
  mediaActions: { alignItems: 'center', gap: theme.spacing.xs },
  mediaAction: {
    width: 38, height: 38, borderRadius: theme.radius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill, borderWidth: 1, borderColor: theme.colors.border,
  },
  offlineBadge: { color: theme.colors.success },
}));

// ─── LibTabs ──────────────────────────────────────────────────────────────────

function LibTabs({ active, onChange, counts }: { active: LibTab; onChange: (_t: LibTab) => void; counts: Record<LibTab, number> }) {
  const styles = useStyles();
  const theme  = useAppTheme();
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <TVTouchable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            showFocusBorder={false}
            style={[styles.tabBtn, isActive ? styles.tabBtnActive : styles.tabBtnInactive]}
          >
            <MaterialIcons
              name={tab.icon}
              size={17}
              color={isActive ? theme.colors.controlSelectedText : theme.colors.textMuted}
            />
            <CustomText
              style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}
            >
              {tab.label}
            </CustomText>
            {counts[tab.id] > 0 ? (
              <View style={[styles.badgeWrap, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <CustomText style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {counts[tab.id]}
                </CustomText>
              </View>
            ) : null}
          </TVTouchable>
        );
      })}
    </View>
  );
}

function LibraryOverview({ counts, loaded, children }: { counts: Record<LibTab, number>; loaded: boolean; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <SurfaceCard tone="strong" style={styles.overviewCard}>
      <View style={styles.overviewTop}>
        <View style={styles.overviewIcon}><Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={styles.overviewLogo} /></View>
        <View style={styles.overviewCopy}>
          <CustomText variant="heading" style={styles.overviewTitle}>Your library</CustomText>
          <CustomText variant="body" style={styles.overviewSubtitle}>{counts.saved} saved · {counts.history} played · {counts.downloads} offline</CustomText>
        </View>
        <View style={styles.overviewStatus}>
          <View style={styles.overviewStatusDot} />
          <CustomText variant="caption" style={styles.overviewStatusText}>{loaded ? 'Ready' : 'Syncing'}</CustomText>
        </View>
      </View>
      {children}
    </SurfaceCard>
  );
}

function CollectionHeader({
  kind,
  count,
  onClear,
}: {
  kind: 'history' | 'downloads';
  count: number;
  onClear?: () => void;
}) {
  const styles = useStyles();
  const theme = useAppTheme();
  const isHistory = kind === 'history';
  return (
    <FadeIn>
      <SurfaceCard tone="strong" style={styles.collectionHero}>
        <View style={styles.collectionHeroTop}>
          <View style={styles.collectionHeroIcon}>
            <MaterialIcons name={isHistory ? 'history' : 'offline-pin'} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.collectionHeroCopy}>
            <CustomText variant="caption" style={styles.collectionEyebrow}>{isHistory ? 'Listening activity' : 'Offline collection'}</CustomText>
            <CustomText variant="heading" style={styles.collectionTitle}>{isHistory ? 'Pick up where you left off' : 'Ready wherever you are'}</CustomText>
            <CustomText variant="body" style={styles.collectionBody}>
              {isHistory
                ? 'Your real recently played items, ordered by your latest activity.'
                : 'Completed downloads are checked against files on this device before they appear here.'}
            </CustomText>
          </View>
        </View>
        <View style={styles.collectionMetaRow}>
          <View style={styles.collectionMeta}>
            <MaterialIcons name={isHistory ? 'play-circle-outline' : 'download-done'} size={15} color={theme.colors.primary} />
            <CustomText variant="caption" style={styles.collectionMetaText}>{count} {isHistory ? 'recently played' : 'available offline'}</CustomText>
          </View>
          {!isHistory ? (
            <View style={styles.collectionMeta}>
              <MaterialIcons name="verified" size={15} color={theme.colors.success} />
              <CustomText variant="caption" style={[styles.collectionMetaText, styles.offlineBadge]}>Device verified</CustomText>
            </View>
          ) : null}
          {isHistory && count > 0 && onClear ? (
            <TVTouchable onPress={onClear} showFocusBorder={false} style={styles.collectionMeta} accessibilityLabel="Clear playback history">
              <MaterialIcons name="delete-sweep" size={15} color={theme.colors.danger} />
              <CustomText variant="caption" style={[styles.collectionMetaText, styles.dangerMetaText]}>Clear history</CustomText>
            </TVTouchable>
          ) : null}
        </View>
      </SurfaceCard>
    </FadeIn>
  );
}

function LibraryMediaList({
  items,
  kind,
  onPlay,
  onRemove,
}: {
  items: FeedCardItem[];
  kind: 'history' | 'downloads';
  onPlay: (_item: FeedCardItem) => void;
  onRemove?: (_item: FeedCardItem) => void;
}) {
  const styles = useStyles();
  const theme = useAppTheme();
  return (
    <FadeIn delay={70}>
      <View style={styles.mediaList}>
      {items.map((item) => (
          <SurfaceCard key={`${kind}-${item.id}`} tone="default" style={styles.mediaRow}>
            <TVTouchable
              onPress={() => onPlay(item)}
              showFocusBorder={false}
              style={styles.mediaArtwork}
              accessibilityRole="button"
              accessibilityLabel={`${item.type === 'video' ? 'Watch' : 'Play'} ${item.title}`}
            >
              <Image source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }} resizeMode="cover" style={styles.mediaImage} />
              <View style={styles.mediaPlay}>
                <MaterialIcons name="play-arrow" size={18} color={theme.colors.mediaText} />
              </View>
            </TVTouchable>
            <TVTouchable onPress={() => onPlay(item)} showFocusBorder={false} style={styles.mediaCopy}>
              <View style={styles.mediaTypeRow}>
                <MaterialIcons name={item.type === 'video' ? 'videocam' : 'music-note'} size={13} color={theme.colors.primary} />
                <CustomText variant="caption" style={styles.mediaType}>{item.type}</CustomText>
              </View>
              <CustomText variant="label" style={styles.mediaTitle} numberOfLines={2}>{item.title}</CustomText>
              {item.subtitle ? <CustomText variant="caption" style={styles.mediaSubtitle} numberOfLines={1}>{item.subtitle}</CustomText> : null}
              <CustomText variant="caption" style={styles.mediaDuration}>{kind === 'downloads' ? 'Available offline' : 'Recently played'}{item.duration ? ` · ${item.duration}` : ''}</CustomText>
            </TVTouchable>
            <View style={styles.mediaActions}>
              <TVTouchable onPress={() => onPlay(item)} showFocusBorder={false} style={styles.mediaAction} accessibilityLabel={`Play ${item.title}`}>
                <MaterialIcons name="play-arrow" size={20} color={theme.colors.primary} />
              </TVTouchable>
              {kind === 'downloads' && onRemove ? (
                <TVTouchable onPress={() => onRemove(item)} showFocusBorder={false} style={styles.mediaAction} accessibilityLabel={`Remove download ${item.title}`}>
                  <MaterialIcons name="delete-outline" size={19} color={theme.colors.danger} />
                </TVTouchable>
              ) : null}
            </View>
          </SurfaceCard>
      ))}
      </View>
    </FadeIn>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const { feed, loading, error, refresh } = useContentFeed();
  const { config: appConfig } = useMobileAppConfig();
  const { favorites, history, loaded, syncError, refreshLibrary, removeFromFavorites, clearPlaybackHistory } = useLocalContent();
  const { isAuthenticated } = useAuth();
  const { downloads, syncError: downloadSyncError, refreshDownloads, deleteDownload } = useDownloads();
  const [activeTab, setActiveTab] = useState<LibTab>('saved');
  const [removingId, setRemovingId]     = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<FeedCardItem | null>(null);
  const [isRemoving, setIsRemoving]     = useState(false);
  const [downloadRemoveTarget, setDownloadRemoveTarget] = useState<FeedCardItem | null>(null);
  const [isDeletingDownload, setIsDeletingDownload] = useState(false);
  const [historyClearOpen, setHistoryClearOpen] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const librarySections = useMemo(() => getLibraryLayoutSections(appConfig), [appConfig]);
  const sectionItems = useMemo(
    () => librarySections.map((section) => ({ section, items: deriveLayoutSectionItems(feed, section, 'library') })),
    [librarySections, feed],
  );

  const recommendedFallback = useMemo(
    () => dedupeFeedItems([...favorites, ...feed.recent, ...feed.music, ...feed.playlists]),
    [favorites, feed.music, feed.playlists, feed.recent],
  );

  const downloadedItems = useMemo(
    () => Object.entries(downloads)
      .filter(([, d]) => d.status === 'done')
      .map(([contentId, d]): FeedCardItem => ({
        id: contentId,
        title: d.title ?? 'Downloaded item',
        subtitle: d.subtitle ?? 'Available offline',
        description: d.description ?? '',
        duration: d.duration ?? '--:--',
        imageUrl: d.imageUrl ?? DEFAULT_CONTENT_IMAGE_URI,
        mediaUrl: d.localUri ?? undefined,
        type: (d.contentType ?? 'audio') as ContentType,
        createdAt: d.savedAt,
      })),
    [downloads],
  );

  const downloadingItems = useMemo(
    () => Object.entries(downloads)
      .filter(([, d]) => d.status === 'downloading')
      .map(([contentId, d]) => ({ contentId, title: d.title ?? 'Downloading…', progress: d.progress })),
    [downloads],
  );

  const counts: Record<LibTab, number> = { saved: favorites.length, history: history.length, downloads: downloadedItems.length };

  const featured   = favorites[0] ?? null;
  const numCols    = device.isTV ? 5 : device.isLargeDesktop ? 4 : device.isDesktop ? 3 : device.isTablet ? 3 : 2;
  const colPercent = `${Math.floor(100 / numCols) - 1}%` as const;
  const gridItems  = useMemo(() => favorites.slice(featured ? 1 : 0), [favorites, featured]);

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackContentPlay(item, source);
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

  const removeDownloadedItem = async () => {
    if (!downloadRemoveTarget) return;
    const item = downloadRemoveTarget;
    setIsDeletingDownload(true);
    try {
      await deleteDownload(item.id);
      showToast({ title: 'Download removed', message: `${item.title} is no longer stored offline.`, tone: 'info' });
      setDownloadRemoveTarget(null);
    } catch {
      showToast({ title: 'Could not remove download', message: 'The file could not be removed. Please try again.', tone: 'warning' });
    } finally {
      setIsDeletingDownload(false);
    }
  };

  const clearHistoryCollection = async () => {
    setIsClearingHistory(true);
    try {
      if (isAuthenticated) await resetRecommendationHistory();
      else await clearInstallationPlaybackHistory();
      await clearPlaybackHistory();
      setHistoryClearOpen(false);
      showToast({ title: 'History cleared', message: 'Your playback history has been removed.', tone: 'success' });
    } catch {
      showToast({ title: 'Could not clear history', message: 'Nothing was removed. Please try again.', tone: 'warning' });
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <>
      <PremiumPage
        title="Library"
        eyebrow="Saved"
        noBack
        refreshing={loading || !loaded}
        onRefresh={() => Promise.all([refresh(), refreshLibrary(), refreshDownloads()]).then(() => undefined)}
      >
        <LibraryOverview counts={counts} loaded={loaded}>
          <LibTabs active={activeTab} onChange={setActiveTab} counts={counts} />
        </LibraryOverview>

        {error ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}
        {syncError ? <ErrorState message={syncError} onRetry={() => void refreshLibrary()} /> : null}
        {downloadSyncError ? <ErrorState message={downloadSyncError} onRetry={() => void refreshDownloads()} /> : null}

        {activeTab === 'saved' ? (
          <>
            {loaded && favorites.length === 0 ? (
              <SurfaceCard tone="strong" style={styles.emptyCard}>
                <View style={styles.emptyIconBox}>
                  <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={styles.emptyLogo} />
                </View>
                <View style={styles.emptyTextWrap}>
                  <CustomText variant="heading" style={styles.emptyTitle}>Build your library</CustomText>
                  <CustomText variant="body" style={styles.emptyBody}>
                    Save songs, videos, and sessions you want to return to.
                  </CustomText>
                </View>
                <View style={styles.emptyActions}>
                  <AppButton
                    title="Discover content"
                    size="lg"
                    variant="gradient"
                    fullWidth
                    onPress={() => router.push(APP_ROUTES.tabs.search)}
                    leftIcon={<MaterialIcons name="search" size={18} color={theme.colors.onPrimary} />}
                  />
                  <AppButton
                    title="Browse music"
                    size="lg"
                    variant="secondary"
                    fullWidth
                    onPress={() => router.push(APP_ROUTES.tabs.player)}
                    leftIcon={<MaterialIcons name="library-music" size={18} color={theme.colors.primary} />}
                  />
                </View>
              </SurfaceCard>
            ) : null}

            {featured ? (
              <FadeIn delay={70}>
                <PremiumHero
                  item={featured}
                  title={featured.title}
                  subtitle={featured.description || featured.subtitle || ''}
                  eyebrow="Top favourite"
                  primaryLabel="Play now"
                  primaryIcon="play-arrow"
                  onPrimary={() => void openItem(featured, 'library_saved')}
                />
              </FadeIn>
            ) : null}

            {gridItems.length > 0 ? (
              <FadeIn delay={110}>
                <View style={styles.collectionSection}>
                  <SectionLabel title="All favourites" accent={`${favorites.length} saved`} subtitle="Your complete favourites collection" />
                <View style={styles.gridWrap}>
                  {gridItems.map((item) => (
                    <View key={item.id} style={[styles.gridItem, { width: colPercent }]}>
                      <FavoriteCard
                        item={item}
                        onPlay={() => void openItem(item, 'library_saved')}
                        onShare={() => void shareItem(item)}
                        onRemove={() => confirmRemove(item)}
                        removing={removingId === item.id}
                      />
                    </View>
                  ))}
                </View>
                </View>
              </FadeIn>
            ) : null}

            {loaded && sectionItems.some(({ items }) => items.length > 0) ? (
              sectionItems.map(({ section, items }) => (
                items.length > 0 ? (
                  <ContentList
                    key={section.id}
                    title={section.title}
                    items={items}
                    onPressItem={(item) => void openItem(item, `library_${section.id}`)}
                  />
                ) : null
              ))
            ) : loaded && recommendedFallback.length > 0 ? (
              <ContentList
                title="Recommended for you"
                items={recommendedFallback}
                onPressItem={(item) => void openItem(item, 'library_recommended')}
              />
            ) : null}
          </>
        ) : null}

        {activeTab === 'history' ? (
          <View style={styles.collectionSection}>
            <CollectionHeader kind="history" count={history.length} onClear={() => setHistoryClearOpen(true)} />
            {loaded && history.length > 0 ? (
              <View style={styles.sectionGap}>
                <SectionLabel title="Recently played" accent={`${history.length} items`} subtitle="Most recent activity first" />
                <LibraryMediaList items={history} kind="history" onPlay={(item) => void openItem(item, 'library_history')} />
              </View>
            ) : loaded ? (
              <SurfaceCard tone="strong" style={styles.emptyCard}>
                <View style={styles.emptyIconBox}><Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={styles.emptyLogo} /></View>
                <View style={styles.emptyTextWrap}>
                  <CustomText variant="heading" style={styles.emptyTitle}>Your listening journey starts here</CustomText>
                  <CustomText variant="body" style={styles.emptyBody}>Play a song, video, or live session and it will appear here automatically.</CustomText>
                </View>
                <View style={styles.emptyActions}>
                  <AppButton title="Discover something to play" size="lg" variant="gradient" fullWidth onPress={() => router.push(APP_ROUTES.tabs.search)} leftIcon={<MaterialIcons name="explore" size={18} color={theme.colors.onPrimary} />} />
                </View>
              </SurfaceCard>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'downloads' ? (
          <View style={styles.collectionSection}>
            <CollectionHeader kind="downloads" count={downloadedItems.length} />
            {downloadingItems.length > 0 ? (
              <SurfaceCard tone="subtle" style={styles.downloadingCard}>
                <SectionLabel title="Downloading" accent={`${downloadingItems.length} active`} subtitle="Keep the app open until each item is complete" />
                {downloadingItems.map((item) => (
                  <View key={item.contentId} style={styles.downloadingRow}>
                    <View style={styles.downloadingTop}>
                      <CustomText variant="label" style={styles.downloadingTitle} numberOfLines={1}>{item.title}</CustomText>
                      <CustomText variant="caption" style={styles.downloadingPct}>{item.progress}%</CustomText>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                    </View>
                  </View>
                ))}
              </SurfaceCard>
            ) : null}

            {downloadedItems.length > 0 ? (
              <View style={styles.sectionGap}>
                <SectionLabel title="Downloaded" accent={`${downloadedItems.length} offline`} subtitle="Stored and verified on this device" />
                <LibraryMediaList
                  items={downloadedItems}
                  kind="downloads"
                  onPlay={(item) => void openItem(item, 'library_downloads')}
                  onRemove={setDownloadRemoveTarget}
                />
              </View>
            ) : downloadingItems.length === 0 ? (
              <SurfaceCard tone="strong" style={styles.emptyCard}>
                <View style={styles.emptyIconBox}><Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={styles.emptyLogo} /></View>
                <View style={styles.emptyTextWrap}>
                  <CustomText variant="heading" style={styles.emptyTitle}>Take worship with you</CustomText>
                  <CustomText variant="body" style={styles.emptyBody}>Use Download on available songs and videos, then play them here without a connection.</CustomText>
                </View>
                <View style={styles.emptyActions}>
                  <AppButton title="Browse downloadable content" size="lg" variant="gradient" fullWidth onPress={() => router.push(APP_ROUTES.tabs.player)} leftIcon={<MaterialIcons name="download" size={18} color={theme.colors.onPrimary} />} />
                </View>
              </SurfaceCard>
            ) : null}
          </View>
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
      <ConfirmModal
        visible={historyClearOpen}
        icon="delete-sweep"
        title="Clear playback history?"
        body="This removes the activity shown in History. Saved items and downloaded files will stay intact."
        primaryLabel="Clear history"
        primaryTone="danger"
        secondaryLabel="Keep history"
        loading={isClearingHistory}
        onPrimary={() => { void clearHistoryCollection(); }}
        onDismiss={() => { if (!isClearingHistory) setHistoryClearOpen(false); }}
      />
      <ConfirmModal
        visible={Boolean(downloadRemoveTarget)}
        icon="delete-outline"
        title="Remove this download?"
        body={downloadRemoveTarget ? `"${downloadRemoveTarget.title}" will be deleted from this device. You can download it again later.` : undefined}
        primaryLabel="Remove download"
        primaryTone="danger"
        secondaryLabel="Keep offline"
        loading={isDeletingDownload}
        onPrimary={() => { void removeDownloadedItem(); }}
        onDismiss={() => { if (!isDeletingDownload) setDownloadRemoveTarget(null); }}
      />
    </>
  );
}

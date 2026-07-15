import React, { useCallback, useMemo, useState } from 'react';
import { Share, View } from 'react-native';
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
import { InlineErrorBanner } from '../../components/ui/InlineErrorBanner';
import { SignInPromptBanner } from '../../components/ui/SignInPromptBanner';
import { useToast } from '../../context/ToastContext';
import { useLocalContent } from '../../hooks/useLocalContent';
import type { FeedCardItem } from '../../services/contentService';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import {
  ContentList,
  ContentRail,
  FavoriteCard,
  PremiumHero,
  PremiumPage,
  SectionLabel,
  dedupeFeedItems,
} from '../../components/feed';

type LibTab = 'saved' | 'history';

const TABS: { id: LibTab; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
  { id: 'saved',   label: 'Saved',   icon: 'bookmark' },
  { id: 'history', label: 'History', icon: 'history' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  tabBar: {
    flexDirection: 'row', gap: 6, padding: 4,
    borderRadius: 12, backgroundColor: theme.colors.subtleFill,
  },
  tabBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12 },
  tabBtnActive:   { backgroundColor: theme.colors.elevated, borderWidth: 1, borderColor: theme.colors.border },
  tabBtnInactive: { backgroundColor: 'transparent', borderWidth: 0 },
  tabLabel:       { fontSize: 12.5 },
  tabLabelActive: { fontWeight: '700', color: theme.colors.text },
  tabLabelInactive:{ fontWeight: '500', color: theme.colors.textMuted },
  badgeWrap:      { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeActive:    { backgroundColor: theme.colors.primary },
  badgeInactive:  { backgroundColor: 'rgba(255,255,255,0.10)' },
  badgeText:      { fontSize: 9, fontWeight: '700' },
  badgeTextActive:{ color: theme.colors.onPrimary },
  badgeTextInactive: { color: theme.colors.primary },
  sectionGap:     { gap: 12 },

  // Saved-tab empty state (ported from the former Favourites screen)
  emptyCard:         { padding: theme.spacing.xl, alignItems: 'center', gap: 18 },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1.5, borderColor: theme.colors.primaryBorder,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  emptyTextWrap:     { alignItems: 'center', gap: 8 },
  emptyTitle:        { color: theme.colors.text, textAlign: 'center' },
  emptyBody:         { color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 360 },
  emptyActions:      { alignItems: 'center', gap: 4, alignSelf: 'stretch' },
  emptySecondaryLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  emptySecondaryLinkText: { color: theme.colors.primary, fontWeight: '600' },

  // Saved-tab responsive grid
  gridWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem:     { minWidth: 130 },
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
              size={15}
              color={isActive ? theme.colors.primary : theme.colors.textMuted}
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const styles = useStyles();
  const theme  = useAppTheme();
  const router = useRouter();
  const device = useDeviceClass();
  const { showToast } = useToast();
  const { feed, loading, error, refresh } = useContentFeed();
  const { config: appConfig } = useMobileAppConfig();
  const { favorites, history, loaded, removeFromFavorites } = useLocalContent();
  const [activeTab, setActiveTab] = useState<LibTab>('saved');
  const [removingId, setRemovingId]     = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<FeedCardItem | null>(null);
  const [isRemoving, setIsRemoving]     = useState(false);

  const librarySections = useMemo(() => getLibraryLayoutSections(appConfig), [appConfig]);
  const sectionItems = useMemo(
    () => librarySections.map((section) => ({ section, items: deriveLayoutSectionItems(feed, section, 'library') })),
    [librarySections, feed],
  );

  const recommendedFallback = useMemo(
    () => dedupeFeedItems([...favorites, ...feed.recent, ...feed.music, ...feed.playlists]),
    [favorites, feed.music, feed.playlists, feed.recent],
  );

  const counts: Record<LibTab, number> = { saved: favorites.length, history: history.length };

  const featured   = favorites[0] ?? null;
  const numCols    = device.isTV ? 5 : device.isLargeDesktop ? 4 : device.isDesktop ? 3 : device.isTablet ? 3 : 2;
  const colPercent = `${Math.floor(100 / numCols) - 1}%` as const;
  const gridItems  = useMemo(() => favorites.slice(featured ? 1 : 0), [favorites, featured]);

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
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
      <PremiumPage
        title="Library"
        eyebrow="Saved"
        noBack
        refreshing={loading || !loaded}
        onRefresh={() => refresh()}
      >
        <LibTabs active={activeTab} onChange={setActiveTab} counts={counts} />

        <SignInPromptBanner message="Sign in so your favourites and history sync across every device." />

        {error ? <InlineErrorBanner message={error} onRetry={() => void refresh()} /> : null}

        {activeTab === 'saved' ? (
          <>
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
                <View style={styles.emptyActions}>
                  <AppButton
                    title="Discover content"
                    size="md"
                    fullWidth
                    onPress={() => router.push(APP_ROUTES.tabs.search)}
                    leftIcon={<MaterialIcons name="search" size={17} color={theme.colors.textInverse} />}
                  />
                  <TVTouchable onPress={() => router.push(APP_ROUTES.tabs.player)} showFocusBorder={false} style={styles.emptySecondaryLink}>
                    <MaterialIcons name="library-music" size={15} color={theme.colors.primary} />
                    <CustomText variant="label" style={styles.emptySecondaryLinkText}>Or browse music</CustomText>
                  </TVTouchable>
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

            {favorites.length > 1 ? (
              <FadeIn delay={110}>
                <SectionLabel title="All favourites" accent={`${favorites.length} saved`} subtitle="Your complete favourites collection" />
              </FadeIn>
            ) : null}

            {gridItems.length > 0 ? (
              <FadeIn delay={140}>
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
          <View style={styles.sectionGap}>
            <SectionLabel title="Recently played" accent="History" />
            <ContentRail
              title=""
              items={history}
              loading={!loaded}
              onPressItem={(item) => void openItem(item, 'library_history')}
              emptyTitle="No history yet"
              emptyMessage="Your recently played tracks will appear here."
            />
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
    </>
  );
}

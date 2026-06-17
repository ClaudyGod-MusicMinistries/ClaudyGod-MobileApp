import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../../components/ui/AppButton';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { useContentFeed } from '../../hooks/useContentFeed';
import type { FeedCardItem } from '../../services/contentService';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { fetchMeLibrary, type MeLibrary, type MeLibraryItem } from '../../services/userFlowService';
import { useAuth } from '../../context/AuthContext';
import {
  ContentList,
  ContentRail,
  EmptyState,
  PremiumPage,
  SectionLabel,
  dedupeFeedItems,
} from '../../components/Exp/PremiumContent';

type LibTab = 'saved' | 'downloads' | 'playlists';

function toFeedCardItem(item: MeLibraryItem): FeedCardItem {
  return {
    id: item.id, title: item.title, subtitle: item.subtitle,
    description: item.description, duration: item.duration || '--:--',
    imageUrl: item.imageUrl || '', mediaUrl: item.mediaUrl,
    type: item.type, createdAt: item.createdAt,
  };
}

function buildPlaylistCards(playlists: MeLibrary['playlists']): FeedCardItem[] {
  return playlists.map((playlist, index) => {
    const seed = playlist.items[0];
    return {
      id: `playlist:${playlist.name}:${index}`, title: playlist.name,
      subtitle: `${playlist.items.length} saved item${playlist.items.length === 1 ? '' : 's'}`,
      description: seed?.description || 'A saved collection in your library.',
      duration: seed?.duration || '--:--', imageUrl: seed?.imageUrl || '',
      mediaUrl: seed?.mediaUrl, type: 'playlist', createdAt: seed?.createdAt,
    };
  });
}

const TABS: { id: LibTab; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
  { id: 'saved',     label: 'Saved',     icon: 'bookmark' },
  { id: 'downloads', label: 'Downloads', icon: 'download-done' },
  { id: 'playlists', label: 'Playlists', icon: 'queue-music' },
];

function LibTabs({ active, onChange, counts }: { active: LibTab; onChange: (_t: LibTab) => void; counts: Record<LibTab, number> }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 6,
        padding: 4,
        borderRadius: 16,
        backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 5, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12,
              backgroundColor: isActive
                ? (theme.scheme === 'dark' ? theme.colors.elevated : '#FFFFFF')
                : 'transparent',
              shadowColor: isActive ? '#000' : 'transparent',
              shadowOpacity: isActive ? 0.10 : 0,
              shadowRadius: isActive ? 4 : 0,
              shadowOffset: { width: 0, height: 2 },
              elevation: isActive ? 2 : 0,
            }}
          >
            <MaterialIcons
              name={tab.icon}
              size={14}
              color={isActive ? theme.colors.primary : theme.colors.textMuted}
            />
            <CustomText
              style={{
                fontSize: 12, fontWeight: isActive ? '700' : '500',
                color: isActive ? theme.colors.text : theme.colors.textMuted,
              }}
            >
              {tab.label}
            </CustomText>
            {counts[tab.id] > 0 ? (
              <View
                style={{
                  minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4,
                  backgroundColor: isActive ? theme.colors.primary : 'rgba(255,255,255,0.10)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <CustomText style={{ fontSize: 9, fontWeight: '700', color: isActive ? '#FFFFFF' : theme.colors.primary }}>
                  {counts[tab.id]}
                </CustomText>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { feed, loading, refresh } = useContentFeed();
  const [library, setLibrary] = useState<MeLibrary | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<LibTab>('saved');

  const loadLibrary = useCallback(async () => {
    if (!isAuthenticated) { setLibrary(null); return; }
    setLibraryLoading(true);
    try { setLibrary(await fetchMeLibrary()); }
    catch { setLibrary(null); }
    finally { setLibraryLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { void loadLibrary(); }, [loadLibrary]);

  const liked      = useMemo(() => (library?.liked.length      ? library.liked.map(toFeedCardItem)         : []), [library?.liked]);
  const downloaded = useMemo(() => (library?.downloaded.length ? library.downloaded.map(toFeedCardItem)    : []), [library?.downloaded]);
  const playlists  = useMemo(() => (library?.playlists.length  ? buildPlaylistCards(library.playlists)     : []), [library?.playlists]);
  const recommended = useMemo(
    () => dedupeFeedItems([...liked, ...downloaded, ...playlists, ...feed.recent, ...feed.music, ...feed.playlists]),
    [downloaded, feed.music, feed.playlists, feed.recent, liked, playlists],
  );

  const counts: Record<LibTab, number> = { saved: liked.length, downloads: downloaded.length, playlists: playlists.length };

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  return (
    <PremiumPage
      title="Library"
      eyebrow="Saved"
      noBack
      refreshing={loading || libraryLoading}
      onRefresh={() => { refresh(); void loadLibrary(); }}
      rightAction={
        <AppButton
          title=""
          variant="secondary"
          size="sm"
          onPress={() => router.push(isAuthenticated ? APP_ROUTES.profile : APP_ROUTES.auth.signIn)}
          leftIcon={<MaterialIcons name={isAuthenticated ? 'person-outline' : 'login'} size={16} color={theme.colors.text} />}
          style={{ minWidth: 40, paddingHorizontal: 10 }}
        />
      }
    >
      {/* Profile bar */}
      {isAuthenticated && user ? (
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            padding: 14, borderRadius: 16, borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          <View
            style={{
              width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
              backgroundColor: theme.colors.card,
            }}
          >
            <CustomText style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '700' }}>
              {(user.displayName ?? user.email ?? 'U')[0]?.toUpperCase()}
            </CustomText>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <CustomText style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
              {user.displayName ?? 'Your library'}
            </CustomText>
            <CustomText style={{ color: theme.colors.textSecondary, fontSize: 11.5, marginTop: 1 }} numberOfLines={1}>
              {liked.length} saved · {downloaded.length} downloads · {playlists.length} playlists
            </CustomText>
          </View>
        </View>
      ) : null}

      {/* Tabs */}
      <LibTabs active={activeTab} onChange={setActiveTab} counts={counts} />

      {/* Tab content */}
      {activeTab === 'saved' ? (
        <>
          <View style={{ gap: 12 }}>
            <SectionLabel title="Saved tracks" accent="Favorites" actionLabel="See all" onAction={() => {}} />
            <ContentRail
              title=""
              items={liked}
              loading={libraryLoading}
              onPressItem={(item) => void openItem(item, 'library_saved')}
              emptyTitle="Save your first favorite"
              emptyMessage="Start from Music, Videos, or Search and keep the moments you love nearby."
            />
          </View>
          {isAuthenticated && !libraryLoading && recommended.length > 0 ? (
            <ContentList
              title="Recommended for you"
              items={recommended}
              onPressItem={(item) => void openItem(item, 'library_recommended')}
            />
          ) : null}
        </>
      ) : null}

      {activeTab === 'downloads' ? (
        <View style={{ gap: 12 }}>
          <SectionLabel title="Downloaded" accent="Offline" />
          <ContentRail
            title=""
            items={downloaded}
            compact
            loading={libraryLoading}
            onPressItem={(item) => void openItem(item, 'library_downloads')}
            emptyTitle="No downloads yet"
            emptyMessage="Downloaded items stay here for quick offline access."
          />
        </View>
      ) : null}

      {activeTab === 'playlists' ? (
        <View style={{ gap: 12 }}>
          <SectionLabel title="Your playlists" accent="Collections" />
          <ContentRail
            title=""
            items={playlists}
            compact
            loading={libraryLoading}
            onPressItem={(item) => void openItem(item, 'library_playlists')}
            emptyTitle="No playlists yet"
            emptyMessage="Build collections from the moments you return to often."
          />
        </View>
      ) : null}

      {/* Guest state */}
      {!isAuthenticated ? (
        <EmptyState
          title="Sign in to keep your favorites"
          message="Create an account or sign in to save songs, videos, and live sessions."
          actionLabel="Sign in"
          onAction={() => router.push(APP_ROUTES.auth.signIn)}
          icon="library-music"
        />
      ) : null}

      {isAuthenticated && !libraryLoading && recommended.length === 0 ? (
        <EmptyState
          title="Your library is open"
          message="Explore music and videos, then save the moments you love."
          actionLabel="Explore music"
          onAction={() => router.push(APP_ROUTES.tabs.player)}
          icon="bookmark-border"
        />
      ) : null}
    </PremiumPage>
  );
}
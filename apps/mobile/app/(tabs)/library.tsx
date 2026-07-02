import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useLocalContent } from '../../hooks/useLocalContent';
import type { FeedCardItem } from '../../services/contentService';
import { APP_ROUTES } from '../../util/appRoutes';
import { buildPlayerRoute } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import {
  ContentList,
  ContentRail,
  EmptyState,
  PremiumPage,
  SectionLabel,
  dedupeFeedItems,
} from '../../components/Exp/PremiumContent';

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
  const router = useRouter();
  const { feed, loading, refresh } = useContentFeed();
  const { favorites, history, loaded } = useLocalContent();
  const [activeTab, setActiveTab] = useState<LibTab>('saved');

  const recommended = useMemo(
    () => dedupeFeedItems([...favorites, ...feed.recent, ...feed.music, ...feed.playlists]),
    [favorites, feed.music, feed.playlists, feed.recent],
  );

  const counts: Record<LibTab, number> = { saved: favorites.length, history: history.length };

  const openItem = async (item: FeedCardItem, source: string) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source });
    router.push(buildPlayerRoute(item));
  };

  return (
    <PremiumPage
      title="Library"
      eyebrow="Saved"
      noBack
      refreshing={loading || !loaded}
      onRefresh={() => refresh()}
    >
      <LibTabs active={activeTab} onChange={setActiveTab} counts={counts} />

      {activeTab === 'saved' ? (
        <>
          <View style={styles.sectionGap}>
            <SectionLabel title="Saved tracks" accent="Favorites" />
            <ContentRail
              title=""
              items={favorites}
              loading={!loaded}
              onPressItem={(item) => void openItem(item, 'library_saved')}
              emptyTitle="Nothing saved yet"
              emptyMessage="Tap the heart on any track to keep it here."
            />
          </View>
          {loaded && recommended.length > 0 ? (
            <ContentList
              title="Recommended for you"
              items={recommended}
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

      {loaded && favorites.length === 0 && history.length === 0 ? (
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

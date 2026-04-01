import React, { useMemo, useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { SearchBar } from '../../components/ui/SearchBar';
import { Chip } from '../../components/ui/Chip';
import { MediaRail } from '../../components/sections/MediaRail';
import { PosterCard } from '../../components/ui/PosterCard';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { Screen } from '../../components/layout/Screen';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useToast } from '../../context/ToastContext';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { APP_ROUTES } from '../../util/appRoutes';
import { getDiscoveryCategories, getDiscoveryShortcuts } from '../../util/mobileExperienceConfig';
import { buildPlayerRoute } from '../../util/playerRoute';

export default function Search() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isDark = theme.scheme === 'dark';
  const isTablet = width >= 768;
  const shortcutWidth = isTablet ? '31.8%' : '100%';
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  const { feed } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();

  const allItems = useMemo(
    () => [
      ...feed.music,
      ...feed.videos,
      ...feed.playlists,
      ...feed.live,
      ...feed.announcements,
      ...feed.mostPlayed,
    ],
    [feed.announcements, feed.live, feed.mostPlayed, feed.music, feed.playlists, feed.videos],
  );

  const discoveryCategories = useMemo(
    () => getDiscoveryCategories(mobileConfig, feed.topCategories),
    [feed.topCategories, mobileConfig],
  );
  const quickShortcuts = useMemo(() => getDiscoveryShortcuts(mobileConfig), [mobileConfig]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allItems.filter((item) => {
      const matchesText =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || item.type === activeCategory;
      return matchesText && matchesCategory;
    });
  }, [activeCategory, allItems, query]);

  const openResult = async (item: (typeof filtered)[number]) => {
    if (query.trim()) {
      setRecentQueries((current) => [query.trim(), ...current.filter((entry) => entry !== query.trim())].slice(0, 5));
    }
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source: 'search_results',
    });
    router.push(buildPlayerRoute(item));
  };

  const applyRecentSearch = () => {
    const recent = recentQueries[0];
    if (!recent) {
      showToast({
        title: 'No recent searches',
        message: 'Search for music, videos, or messages first.',
        tone: 'info',
      });
      return;
    }

    setQuery(recent);
    setActiveCategory('All');
  };

  const cycleCategory = () => {
    const currentIndex = discoveryCategories.indexOf(activeCategory as (typeof discoveryCategories)[number]);
    const nextCategory = discoveryCategories[(currentIndex + 1) % discoveryCategories.length] ?? 'All';
    setActiveCategory(nextCategory);
    showToast({
      title: 'Filter updated',
      message: `Showing ${nextCategory === 'All' ? 'all results' : nextCategory} results.`,
      tone: 'info',
      durationMs: 1800,
    });
  };

  const handleSubmitSearch = () => {
    const normalized = query.trim();
    if (!normalized) {
      showToast({
        title: 'Search is empty',
        message: 'Enter a title, artist, or topic.',
        tone: 'warning',
      });
      return;
    }

    setRecentQueries((current) => [normalized, ...current.filter((entry) => entry !== normalized)].slice(0, 5));
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        stickyHeaderIndices={[0]}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <View
          style={{
            backgroundColor: isDark ? '#06040D' : theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,33,0.08)',
          }}
        >
          <Screen>
            <FadeIn>
              <View
                style={{
                  paddingTop: theme.layout.headerVerticalPadding,
                  paddingBottom: theme.spacing.sm,
                }}
              >
                <BrandedHeaderCard
                  title="Search"
                  subtitle="Find music, videos and playlists"
                  actions={[
                    { icon: 'history', onPress: applyRecentSearch, accessibilityLabel: 'Recent searches' },
                    { icon: 'tune', onPress: cycleCategory, accessibilityLabel: 'Search filters' },
                    { icon: 'person-outline', onPress: () => router.push(APP_ROUTES.profile), accessibilityLabel: 'Profile' },
                  ]}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: theme.layout.sectionGap }}>
          <FadeIn>
            <SurfaceCard tone="subtle" style={{ padding: theme.spacing.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text }}>
                    Discover
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                    Search live streams, music, videos, playlists, and messages.
                  </CustomText>
                </View>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.radius.md,
                    backgroundColor: `${theme.colors.primary}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="travel-explore" size={18} color={theme.colors.primary} />
                </View>
              </View>

              <View style={{ marginTop: theme.spacing.md }}>
                <SearchBar value={query} onChangeText={setQuery} onSubmit={handleSubmitSearch} />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
                {quickShortcuts.map((shortcut) => (
                  <TVTouchable
                    key={shortcut.label}
                    onPress={() => {
                      setQuery(shortcut.query);
                      setActiveCategory(shortcut.category);
                    }}
                    style={{
                      width: shortcutWidth,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      paddingVertical: 11,
                      paddingHorizontal: 11,
                    }}
                    showFocusBorder={false}
                  >
                    <MaterialIcons name={shortcut.icon as any} size={16} color={theme.colors.primary} />
                    <CustomText variant="caption" style={{ color: theme.colors.text, marginTop: 6 }}>
                      {shortcut.label}
                    </CustomText>
                  </TVTouchable>
                ))}
              </View>
            </SurfaceCard>
          </FadeIn>

          <FadeIn delay={120}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingVertical: theme.spacing.md,
                paddingRight: theme.spacing.md,
              }}
              overScrollMode="never"
            >
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                {discoveryCategories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat === 'All' ? cat : cat.toUpperCase()}
                    active={cat === activeCategory}
                    onPress={() => setActiveCategory(cat)}
                  />
                ))}
              </View>
            </ScrollView>
          </FadeIn>

          <FadeIn delay={200}>
            <MediaRail
              title="Results"
              actionLabel={`${filtered.length} found`}
              data={filtered}
              renderItem={(item) => (
                <PosterCard
                  key={item.id}
                  imageUrl={item.imageUrl}
                  title={item.title}
                  subtitle={item.subtitle}
                  size="sm"
                  onPress={() => void openResult(item)}
                />
              )}
            />
          </FadeIn>

          {!filtered.length ? (
            <FadeIn delay={260}>
              <SurfaceCard style={{ padding: theme.spacing.lg }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text }}>
                  No matches found
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                  Try a broader keyword or reset your active category.
                </CustomText>
                <View style={{ marginTop: theme.spacing.md }}>
                  <AppButton
                    title="Reset filters"
                    variant="outline"
                    size="sm"
                    fullWidth
                    onPress={() => {
                      setActiveCategory('All');
                      setQuery('');
                    }}
                  />
                </View>
              </SurfaceCard>
            </FadeIn>
          ) : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

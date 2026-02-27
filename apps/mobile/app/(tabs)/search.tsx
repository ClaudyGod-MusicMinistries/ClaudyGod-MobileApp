import React, { useMemo, useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
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
import { useContentFeed } from '../../hooks/useContentFeed';
import { buildPlayerRoute } from '../../util/playerRoute';

const baseCategories = ['All', 'audio', 'video', 'playlist', 'live', 'announcement'];

export default function Search() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDark = theme.scheme === 'dark';
  const isCompact = width < 360;
  const isTablet = width >= 768;
  const shortcutWidth = isCompact ? '100%' : isTablet ? '31.8%' : '48%';
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const { feed } = useContentFeed();

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

  const quickShortcuts = useMemo(
    () => [
      { icon: 'graphic-eq', label: 'Trending worship', query: 'worship' },
      { icon: 'live-tv', label: 'Live channels', query: 'live' },
      { icon: 'menu-book', label: 'Daily messages', query: 'message' },
    ],
    [],
  );

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

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
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
              <View style={{ paddingTop: theme.spacing.lg, paddingBottom: 10 }}>
                <BrandedHeaderCard
                  title="Search"
                  subtitle="Find music, videos and playlists"
                  actions={[
                    { icon: 'history', onPress: () => undefined, accessibilityLabel: 'Recent searches' },
                    { icon: 'tune', onPress: () => undefined, accessibilityLabel: 'Search filters' },
                    { icon: 'person-outline', onPress: () => router.push('/profile'), accessibilityLabel: 'Profile' },
                  ]}
                />
              </View>
            </FadeIn>
          </Screen>
        </View>

        <Screen>
          <View style={{ paddingTop: 14 }}>
          <FadeIn>
            <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                    Discover
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
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
                <SearchBar value={query} onChangeText={setQuery} onSubmit={() => undefined} />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
                {quickShortcuts.map((shortcut) => (
                  <TVTouchable
                    key={shortcut.label}
                    onPress={() => {
                      setQuery(shortcut.query);
                      setActiveCategory('All');
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
                    <CustomText variant="caption" style={{ color: theme.colors.text.primary, marginTop: 6 }}>
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
                {baseCategories.map((cat) => (
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
                  onPress={() => router.push(buildPlayerRoute(item))}
                />
              )}
            />
          </FadeIn>

          {!filtered.length ? (
            <FadeIn delay={260}>
              <SurfaceCard style={{ padding: theme.spacing.lg }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  No matches found
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
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

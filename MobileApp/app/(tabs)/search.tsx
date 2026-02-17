// app/(tabs)/search.tsx
import React, { useMemo, useState } from 'react';
import { View, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { SearchBar } from '../../components/ui/SearchBar';
import { Chip } from '../../components/ui/Chip';
import { MediaRail } from '../../components/sections/MediaRail';
import { PosterCard } from '../../components/ui/PosterCard';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { Screen } from '../../components/layout/Screen';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';

const categories = ['All', 'Worship', 'Sermons', 'Podcasts', 'Kids', 'Live', 'Playlists'];

const quickShortcuts = [
  { icon: 'graphic-eq', label: 'Trending worship', query: 'worship' },
  { icon: 'mic', label: 'Live sermons', query: 'live' },
  { icon: 'queue-music', label: 'Morning playlist', query: 'playlist' },
];

const discoverSets = [
  {
    id: 'd1',
    title: 'Top Gospel Mixes',
    subtitle: 'Updated daily',
    imageUrl: 'https://images.unsplash.com/photo-1501281667305-0d4ebdb2c8e6?auto=format&fit=crop&w=800&q=80',
    type: 'Playlists',
  },
  {
    id: 'd2',
    title: 'Prayer & Meditation',
    subtitle: 'Deep focus',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    type: 'Worship',
  },
  {
    id: 'd3',
    title: 'Youth Anthems',
    subtitle: 'New drops',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
    type: 'Kids',
  },
];

const topCreators = [
  {
    id: 'c1',
    title: 'ClaudyGod Live',
    subtitle: '1.2M followers',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
    type: 'Live',
  },
  {
    id: 'c2',
    title: 'Hillsong Worship',
    subtitle: '980K followers',
    imageUrl: 'https://images.unsplash.com/photo-1544717301-9cdcb1f5940f?auto=format&fit=crop&w=800&q=80',
    type: 'Worship',
  },
  {
    id: 'c3',
    title: 'Elevation',
    subtitle: '760K followers',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80',
    type: 'Sermons',
  },
];

export default function Search() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const shortcutWidth = isCompact ? '100%' : '48%';
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    const allItems = [...discoverSets, ...topCreators];
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesText = !q || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || item.type === activeCategory;
      return matchesText && matchesCategory;
    });
  }, [activeCategory, query]);

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: theme.spacing.md }}
      >
        <Screen>
          <FadeIn>
            <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                    Search Workspace
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                    Find songs, videos, playlists, and creators with precise filters.
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
                <SearchBar value={query} onChangeText={setQuery} onSubmit={() => console.log('search', query)} />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
                {quickShortcuts.map((shortcut) => (
                  <TouchableOpacity
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
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                    }}
                  >
                    <MaterialIcons name={shortcut.icon as any} size={16} color={theme.colors.primary} />
                    <CustomText variant="caption" style={{ color: theme.colors.text.primary, marginTop: 6 }}>
                      {shortcut.label}
                    </CustomText>
                  </TouchableOpacity>
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
            >
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                {categories.map((cat) => (
                  <Chip key={cat} label={cat} active={cat === activeCategory} onPress={() => setActiveCategory(cat)} />
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
                  onPress={() => console.log('open', item.id)}
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
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

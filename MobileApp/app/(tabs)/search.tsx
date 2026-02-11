// app/(tabs)/search.tsx
import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { SearchBar } from '../../components/ui/SearchBar';
import { Chip } from '../../components/ui/Chip';
import { MediaRail } from '../../components/sections/MediaRail';
import { PosterCard } from '../../components/ui/PosterCard';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { Screen } from '../../components/layout/Screen';

const categories = ['All', 'Worship', 'Sermons', 'Podcasts', 'Kids', 'Live', 'Playlists'];

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
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const allItems = [...discoverSets, ...topCreators];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesText =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || item.type === activeCategory;
      return matchesText && matchesCategory;
    });
  }, [activeCategory, allItems, query]);

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: theme.spacing.md }}
      >
        <Screen>
          <FadeIn>
            <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 20 }}>
              Discover
            </CustomText>
            <CustomText style={{ color: theme.colors.text.secondary, marginTop: 2, fontSize: 12 }}>
              Search by keyword, category, or creator.
            </CustomText>
          </FadeIn>

          <FadeIn delay={120} style={{ marginTop: theme.spacing.md }}>
            <SearchBar value={query} onChangeText={setQuery} onSubmit={() => console.log('search', query)} />
          </FadeIn>

          <FadeIn delay={160}>
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

          <FadeIn delay={220} style={{ marginTop: theme.spacing.sm }}>
            <MediaRail
              title="Results"
              actionLabel={filtered.length ? `${filtered.length} found` : undefined}
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
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

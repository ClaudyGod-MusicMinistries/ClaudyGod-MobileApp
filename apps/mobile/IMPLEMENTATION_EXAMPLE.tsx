/**
 * IMPLEMENTATION EXAMPLE
 * Shows how to apply the new design system to a real screen
 *
 * This is a reference example - adapt to your actual screen structure
 * Location: Would replace parts of app/(tabs)/home.tsx
 */

import React from 'react';
import { ScrollView, View, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// New premium components
import { ElevatedCard, SimpleCard } from '../components/ui/PremiumCard';
import { FeaturedCard } from '../components/ui/FeaturedCard';
import { ModernContentCard } from '../components/ui/ModernContentCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';

// Design system tokens
import { designSystem } from '../theme/designSystem';
import { useAppTheme } from '../util/colorScheme';

/**
 * EXAMPLE 1: Hero Section with Featured Card
 * High-impact first section that draws users in
 */
function HeroSection({ featured, onPlayFeatured }) {
  return (
    <View style={{ marginBottom: 32 }}>
      <FeaturedCard
        imageUrl={featured?.imageUrl || 'https://via.placeholder.com/300x300'}
        title={featured?.title || 'Now Streaming'}
        subtitle={featured?.artist || 'Discover new content'}
        badge={featured?.badge || 'FEATURED'}
        onPress={onPlayFeatured}
        height={280}
      />
    </View>
  );
}

/**
 * EXAMPLE 2: Content Rail with Title
 * Reusable pattern for "For You", "Recent", "Trending", etc.
 */
function ContentRailSection({
  title,
  eyebrow,
  items,
  onSeeAll,
  onItemPress,
  size = 'md',
}) {
  return (
    <View style={{ marginBottom: 32 }}>
      {/* Section Title - Using improved SectionHeader */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          actionLabel="See All"
          onAction={onSeeAll}
        />
      </View>

      {/* Horizontal List - Content Rail */}
      <FlatList
        data={items}
        horizontal
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={140} // Adjust based on card width
        decelerationRate="fast"
        renderItem={({ item, index }) => (
          <View
            key={item.id}
            style={{
              paddingLeft: index === 0 ? 16 : 6,
              paddingRight: index === items.length - 1 ? 16 : 6,
            }}
          >
            <ModernContentCard
              id={item.id}
              imageUrl={item.imageUrl}
              title={item.title}
              subtitle={item.subtitle}
              author={item.author}
              plays={item.plays}
              likes={item.likes}
              duration={item.duration}
              isPlaying={item.isPlaying}
              badge={item.badge}
              size={size}
              onPress={() => onItemPress(item)}
              onPlayPress={() => onItemPress(item)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

/**
 * EXAMPLE 3: Info Card Section
 * For promotions, ministry messages, or CTAs
 */
function PromotionalSection() {
  const theme = useAppTheme();

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
      {/* Premium gradient background */}
      <View
        style={{
          borderRadius: designSystem.radius.xl,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={designSystem.gradients.hero.vibrant}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: designSystem.spacing.lg }}
        >
          <CustomText
            variant="heading"
            style={{
              color: 'white',
              marginBottom: designSystem.spacing.md,
              fontSize: 22,
            }}
          >
            Support the Ministry
          </CustomText>

          <CustomText
            variant="body"
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: designSystem.spacing.lg,
              lineHeight: 24,
            }}
          >
            Your support helps us reach more people with worship and spiritual growth.
          </CustomText>

          <AppButton
            title="Give Support"
            variant="secondary"
            size="lg"
            fullWidth
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          />
        </LinearGradient>
      </View>
    </View>
  );
}

/**
 * EXAMPLE 4: Stat Cards Row
 * Display metrics or statistics
 */
function StatsSection() {
  const stats = [
    { label: 'Hours Streamed', value: '1.2K' },
    { label: 'Favorites', value: '847' },
    { label: 'Playlists', value: '23' },
  ];

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
      <SectionHeader title="Your Stats" />

      <View style={{ flexDirection: 'row', gap: designSystem.spacing.md }}>
        {stats.map((stat, index) => (
          <View key={index} style={{ flex: 1 }}>
            <SimpleCard>
              <CustomText
                variant="body"
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  marginBottom: designSystem.spacing.xs,
                }}
              >
                {stat.value}
              </CustomText>
              <CustomText
                variant="caption"
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                {stat.label}
              </CustomText>
            </SimpleCard>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * EXAMPLE 5: Guest Mode Banner
 * Information/warning banners
 */
function GuestModeBanner() {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
      <ElevatedCard padding="md">
        <View style={{ flexDirection: 'row', gap: designSystem.spacing.md }}>
          <CustomText
            variant="body"
            style={{ fontWeight: '600', marginBottom: designSystem.spacing.xs }}
          >
            📱 Guest Mode
          </CustomText>
          <CustomText
            variant="body"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              flex: 1,
            }}
          >
            Sign in to unlock saved content and create playlists
          </CustomText>
        </View>
        <AppButton
          title="Sign In"
          variant="primary"
          size="sm"
          fullWidth
          style={{ marginTop: designSystem.spacing.md }}
        />
      </ElevatedCard>
    </View>
  );
}

/**
 * EXAMPLE 6: Complete Home Screen Component
 * Shows how everything fits together
 */
export default function ModernizedHomeScreen() {
  const theme = useAppTheme();

  // Mock data
  const featured = {
    id: '1',
    title: 'Sunday Worship Service',
    artist: 'Live from the sanctuary',
    imageUrl: 'https://via.placeholder.com/400x400',
    badge: 'LIVE NOW',
  };

  const forYouItems = [
    {
      id: '1',
      title: 'Song of the Week',
      subtitle: 'Artist Name',
      imageUrl: 'https://via.placeholder.com/120x120',
      plays: 15000,
      likes: 2500,
      duration: '3:45',
    },
    {
      id: '2',
      title: 'Latest Sermon',
      subtitle: 'Pastor John',
      imageUrl: 'https://via.placeholder.com/120x120',
      plays: 8000,
      likes: 1200,
      duration: '42:30',
    },
    {
      id: '3',
      title: 'Worship Playlist',
      subtitle: 'Curated for you',
      imageUrl: 'https://via.placeholder.com/120x120',
      plays: 22000,
      likes: 4500,
    },
  ];

  const recentItems = [
    {
      id: '4',
      title: 'Yesterday\'s Service',
      subtitle: 'Worship & Sermon',
      imageUrl: 'https://via.placeholder.com/120x120',
      plays: 5000,
    },
    {
      id: '5',
      title: 'Prayer Time',
      subtitle: 'Guided Prayer',
      imageUrl: 'https://via.placeholder.com/120x120',
      plays: 3000,
    },
  ];

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: theme.colors.canvas,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Padding */}
      <View style={{ height: 8 }} />

      {/* 1. Hero Section - Maximum Impact */}
      <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
        <HeroSection
          featured={featured}
          onPlayFeatured={() => console.log('Play featured')}
        />
      </View>

      {/* 2. Guest Mode Banner (if needed) */}
      <GuestModeBanner />

      {/* 3. For You Section - Personalized Content */}
      <ContentRailSection
        title="For You"
        eyebrow="PERSONALIZED"
        items={forYouItems}
        size="md"
        onSeeAll={() => console.log('See all for you')}
        onItemPress={(item) => console.log('Play:', item.title)}
      />

      {/* 4. Recent Listens - Quick Access */}
      <ContentRailSection
        title="Continue Listening"
        eyebrow="RECENT"
        items={recentItems}
        size="md"
        onSeeAll={() => console.log('See all recent')}
        onItemPress={(item) => console.log('Play:', item.title)}
      />

      {/* 5. Stats Section - User Engagement */}
      <StatsSection />

      {/* 6. Promotional Banner - Call to Action */}
      <PromotionalSection />

      {/* Bottom Padding */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. Replace existing home.tsx import with ModernizedHomeScreen
 * 2. Adjust mock data to pull from actual API/state
 * 3. Update navigation handlers (onPlayFeatured, onItemPress, etc.)
 * 4. Test animations on real device (not emulator)
 * 5. Verify shadows render correctly
 * 6. Check dark mode appearance
 *
 * SPACING REFERENCE:
 * - Screen margins: 16px (paddingHorizontal)
 * - Section gaps: 32px (marginBottom)
 * - Element gaps: 12-16px
 * - Card padding: 12-16px
 *
 * COLOR REFERENCE:
 * - Background: theme.colors.canvas
 * - Cards: theme.colors.surface
 * - Text: theme.colors.text
 * - Muted text: rgba(255, 255, 255, 0.6-0.7)
 *
 * PERFORMANCE TIPS:
 * - Use FlatList for horizontal scrolling (not ScrollView)
 * - Add keyExtractor to FlatList
 * - Use snapToInterval for snappy scrolling
 * - Memoize components if they have expensive renders
 */

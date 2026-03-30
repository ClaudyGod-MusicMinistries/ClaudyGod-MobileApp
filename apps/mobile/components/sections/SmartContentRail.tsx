/**
 * Smart Content Rail Component
 * Displays scrollable content with engagement metrics and smart recommendations
 * Uses design tokens for responsive, mobile-friendly spacing and typography
 */

import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Animated,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { CustomText } from '../CustomText';
import { ModernContentCard } from '../ui/ModernContentCard';
import { FadeIn } from '../ui/FadeIn';
import { colors } from '../../constants/color';
import { spacing } from '../../styles/designTokens';

interface ContentItem {
  id: string;
  title: string;
  imageUrl?: string;
  author?: string;
  plays?: number;
  likes?: number;
  duration?: string;
  badge?: string;
  onPress: () => void;
  onPlayPress?: () => void;
}

interface SmartContentRailProps {
  title: string;
  subtitle?: string;
  items: ContentItem[];
  cardSize?: 'sm' | 'md' | 'lg';
  horizontal?: boolean;
  onSeeAll?: () => void;
  showEngagementHint?: boolean;
}

// Get responsive card width based on size
const getCardWidth = (size: 'sm' | 'md' | 'lg', screenWidth: number) => {
  if (size === 'sm') return Math.max(130, screenWidth * 0.35);
  if (size === 'lg') return Math.max(200, screenWidth * 0.6);
  return Math.max(160, screenWidth * 0.45);
};

export function SmartContentRail({
  title,
  subtitle,
  items,
  cardSize = 'md',
  horizontal = true,
  onSeeAll,
  showEngagementHint = false,
}: SmartContentRailProps) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollPos = useRef(new Animated.Value(0)).current;
  const [showMore, setShowMore] = useState(false);
  const colors_light = colors.light;

  const displayItems = showMore ? items : items.slice(0, 6);
  const cardWidth = getCardWidth(cardSize, screenWidth);

  if (horizontal) {
    return (
      <FadeIn>
        <View style={{ marginBottom: spacing.lg }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: spacing.md,
              marginBottom: spacing.sm,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <View style={{ flex: 1 }}>
              <CustomText
                variant="title"
                style={{
                  color: colors_light.text,
                  marginBottom: spacing.xs,
                }}
              >
                {title}
              </CustomText>
              {subtitle && (
                <CustomText
                  variant="label"
                  style={{
                    color: colors_light.textSecondary,
                  }}
                >
                  {subtitle}
                </CustomText>
              )}
            </View>

            {onSeeAll && (
              <Pressable onPress={onSeeAll}>
                <CustomText
                  variant="label"
                  style={{
                    color: colors_light.accent,
                    fontWeight: '600',
                  }}
                >
                  See all →
                </CustomText>
              </Pressable>
            )}
          </View>

          {/* Content Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollPos } } }],
              { useNativeDriver: false }
            )}
          >
            {items.map((item) => (
              <View key={item.id} style={{ width: cardWidth }}>
                <ModernContentCard
                  id={item.id}
                  imageUrl={item.imageUrl}
                  title={item.title}
                  author={item.author}
                  plays={item.plays}
                  likes={item.likes}
                  duration={item.duration}
                  badge={item.badge}
                  onPress={item.onPress}
                  onPlayPress={item.onPlayPress}
                  size={cardSize}
                />
              </View>
            ))}
          </ScrollView>

          {/* Engagement Hint */}
          {showEngagementHint && (
            <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.xs }}>
              <CustomText
                variant="caption"
                style={{
                  color: colors_light.textSecondary,
                  fontStyle: 'italic',
                }}
              >
                💡 Based on your listening history
              </CustomText>
            </View>
          )}
        </View>
      </FadeIn>
    );
  }

  // Grid layout
  return (
    <FadeIn>
      <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
        {/* Header */}
        <View
          style={{
            marginBottom: spacing.sm,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <CustomText
              variant="title"
              style={{
                color: colors_light.text,
                marginBottom: spacing.xs,
              }}
            >
              {title}
            </CustomText>
            {subtitle && (
              <CustomText
                variant="label"
                style={{
                  color: colors_light.textSecondary,
                }}
              >
                {subtitle}
              </CustomText>
            )}
          </View>

          {onSeeAll && (
            <Pressable onPress={onSeeAll}>
              <CustomText
                variant="label"
                style={{
                  color: colors_light.accent,
                  fontWeight: '600',
                }}
              >
                See all →
              </CustomText>
            </Pressable>
          )}
        </View>

        {/* Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {displayItems.map((item) => (
            <View key={item.id} style={{ width: (screenWidth - spacing.md * 2 - spacing.sm) / 2 }}>
              <ModernContentCard
                id={item.id}
                imageUrl={item.imageUrl}
                title={item.title}
                author={item.author}
                plays={item.plays}
                likes={item.likes}
                badge={item.badge}
                onPress={item.onPress}
                onPlayPress={item.onPlayPress}
                size="md"
              />
            </View>
          ))}
        </View>

        {/* Show More Button */}
        {items.length > 6 && !showMore && (
          <Pressable
            onPress={() => setShowMore(true)}
            style={{
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: colors_light.accent,
              alignItems: 'center',
            }}
          >
            <CustomText
              variant="title"
              style={{
                color: colors_light.accent,
                fontWeight: '700',
              }}
            >
              Load More
            </CustomText>
            </Pressable>
          )}
      </View>
    </FadeIn>
  );
}

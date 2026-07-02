import React, { useState, useRef } from 'react';
import { View, ScrollView, Animated, useWindowDimensions, Pressable } from 'react-native';
import { CustomText } from '../CustomText';
import { ModernContentCard } from '../ui/ModernContentCard';
import { FadeIn } from '../ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

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

const getCardWidth = (size: 'sm' | 'md' | 'lg', screenWidth: number) => {
  if (size === 'sm') return Math.max(96, screenWidth * 0.3);
  if (size === 'lg') return Math.max(150, screenWidth * 0.5);
  return Math.max(120, screenWidth * 0.4);
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  headerRow: {
    paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  headerFill:     { flex: 1 },
  titleText:      { color: theme.colors.text, marginBottom: theme.spacing.xs, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  subtitleText:   { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 14 },
  seeAllText:     { color: theme.colors.primary, fontWeight: '600' },
  outerH:         { marginBottom: theme.spacing.lg },
  hScrollContent: { paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm },
  engagementWrap: { paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.xs },
  engagementText: { color: theme.colors.textSecondary, fontStyle: 'italic' },
  outerV:         { paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg },
  gridRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  loadMoreBtn: {
    marginTop: theme.spacing.md, paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.lg,
    borderWidth: 1.5, borderColor: theme.colors.primary, alignItems: 'center',
  },
  loadMoreText: { color: theme.colors.primary, fontWeight: '700' },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function SmartContentRail({
  title,
  subtitle,
  items,
  cardSize = 'md',
  horizontal = true,
  onSeeAll,
  showEngagementHint = false,
}: SmartContentRailProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const scrollPos = useRef(new Animated.Value(0)).current;
  const [showMore, setShowMore] = useState(false);

  const displayItems = showMore ? items : items.slice(0, 6);
  const cardWidth = getCardWidth(cardSize, screenWidth);

  const Header = () => (
    <View style={styles.headerRow}>
      <View style={styles.headerFill}>
        <CustomText variant="title" style={styles.titleText}>{title}</CustomText>
        {subtitle ? (
          <CustomText variant="label" style={styles.subtitleText}>{subtitle}</CustomText>
        ) : null}
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll}>
          <CustomText variant="label" style={styles.seeAllText}>See all →</CustomText>
        </Pressable>
      ) : null}
    </View>
  );

  if (horizontal) {
    return (
      <FadeIn>
        <View style={styles.outerH}>
          <Header />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={styles.hScrollContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollPos } } }],
              { useNativeDriver: false },
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
          {showEngagementHint ? (
            <View style={styles.engagementWrap}>
              <CustomText variant="caption" style={styles.engagementText}>
                Based on your listening history
              </CustomText>
            </View>
          ) : null}
        </View>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <View style={styles.outerV}>
        <Header />
        <View style={styles.gridRow}>
          {displayItems.map((item) => (
            <View
              key={item.id}
              style={{ width: (screenWidth - theme.spacing.md * 2 - theme.spacing.sm) / 2 }}
            >
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
        {items.length > 6 && !showMore ? (
          <Pressable onPress={() => setShowMore(true)} style={styles.loadMoreBtn}>
            <CustomText variant="title" style={styles.loadMoreText}>Load More</CustomText>
          </Pressable>
        ) : null}
      </View>
    </FadeIn>
  );
}

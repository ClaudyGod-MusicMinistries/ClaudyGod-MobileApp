/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(tabs)/PlaySection.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  useWindowDimensions,
  Keyboard,
  Platform
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { CustomText } from '../../components/CustomText';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { MaterialIcons } from '@expo/vector-icons';
import { RecentSongsSection } from '../../components/RecentSongs';
import { TabScreenWrapper } from './TextWrapper';
import { tv as tvTokens } from '../../styles/designTokens';

interface GridItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  type: 'song' | 'playlist' | 'album';
  height: number;
}

export default function PlaySection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isTV = Platform.isTV;
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchIconAnim = useRef(new Animated.Value(1)).current;
  const searchContainerAnim = useRef(new Animated.Value(0)).current;

  // Responsive calculations
  const getResponsiveSizes = () => {
    if (SCREEN_WIDTH < 375) {
      return {
        containerPadding: 16,
        searchHeight: 52,
        searchBorderRadius: 26,
        iconSize: 18,
        fontSize: 14,
        headerMargin: 8,
        cardSpacing: 12,
        numColumns: 2,
        baseCardHeight: 180,
        heightVariation: 40
      };
    } else if (SCREEN_WIDTH < 414) {
      return {
        containerPadding: 20,
        searchHeight: 56,
        searchBorderRadius: 28,
        iconSize: 20,
        fontSize: 15,
        headerMargin: 12,
        cardSpacing: 14,
        numColumns: 2,
        baseCardHeight: 200,
        heightVariation: 50
      };
    } else {
      return {
        containerPadding: 24,
        searchHeight: 60,
        searchBorderRadius: 30,
        iconSize: 22,
        fontSize: 16,
        headerMargin: 16,
        cardSpacing: 16,
        numColumns: 2,
        baseCardHeight: 220,
        heightVariation: 60
      };
    }
  };

  const sizes = getResponsiveSizes();

  // Generate subtle height variations
  const generateSubtleHeights = () => {
    const patterns = [
      sizes.baseCardHeight,
      sizes.baseCardHeight + (sizes.heightVariation * 0.3),
      sizes.baseCardHeight + (sizes.heightVariation * 0.6),
      sizes.baseCardHeight - (sizes.heightVariation * 0.2),
      sizes.baseCardHeight + (sizes.heightVariation * 0.8),
      sizes.baseCardHeight - (sizes.heightVariation * 0.1),
      sizes.baseCardHeight + (sizes.heightVariation * 0.4),
      sizes.baseCardHeight - (sizes.heightVariation * 0.3),
      sizes.baseCardHeight + (sizes.heightVariation * 0.7),
      sizes.baseCardHeight,
      sizes.baseCardHeight + (sizes.heightVariation * 0.5),
      sizes.baseCardHeight - (sizes.heightVariation * 0.15),
    ];
    return patterns;
  };

  const heightPatterns = generateSubtleHeights();

  // Sample data for the masonry grid
  const gridItems: GridItem[] = [
    {
      id: '1',
      title: 'Worship Hits 2024',
      subtitle: 'Latest worship songs collection',
      imageUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[0]
    },
    {
      id: '2',
      title: 'Gospel Mix',
      subtitle: 'Powerful gospel songs for your soul',
      imageUrl: 'https://images.unsplash.com/photo-1501281667305-0d4ebdb2c8e6?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[1]
    },
    {
      id: '3',
      title: 'Prayer Time',
      subtitle: 'Songs for meditation and prayer',
      imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[2]
    },
    {
      id: '4',
      title: 'Sunday Service',
      subtitle: 'Complete Sunday worship experience',
      imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[3]
    },
    {
      id: '5',
      title: 'Kids Praise',
      subtitle: 'Fun songs for children',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[4]
    },
    {
      id: '6',
      title: 'Youth Anthem',
      subtitle: 'Modern worship for the youth',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[5]
    },
    {
      id: '7',
      title: 'Healing Songs',
      subtitle: 'Music for comfort and healing',
      imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[6]
    },
    {
      id: '8',
      title: 'Christmas Joy',
      subtitle: 'Festive songs for the holiday season',
      imageUrl: 'https://images.unsplash.com/photo-1544717301-9cdcb1f5940f?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[7]
    },
    {
      id: '9',
      title: 'African Praise',
      subtitle: 'Rhythmic African worship music',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[8]
    },
    {
      id: '10',
      title: 'Evening Meditation',
      subtitle: 'Calming songs for your evening devotion',
      imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[9]
    },
    {
      id: '11',
      title: 'Morning Devotion',
      subtitle: 'Start your day with uplifting music',
      imageUrl: 'https://images.unsplash.com/photo-1501281667305-0d4ebdb2c8e6?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[10]
    },
    {
      id: '12',
      title: 'Revival Fire',
      subtitle: 'Powerful songs for spiritual awakening',
      imageUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3',
      type: 'playlist',
      height: heightPatterns[11]
    }
  ];

  // Search animations
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.parallel([
      Animated.timing(searchIconAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(searchContainerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    if (!searchQuery) {
      Animated.parallel([
        Animated.timing(searchIconAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(searchContainerAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
    Keyboard.dismiss();
  };

  const handleItemPress = (item: GridItem) => {
    console.log('Item pressed:', item.title);
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const searchContainerScale = searchContainerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1]
  });

  // Render individual masonry card
  const renderMasonryCard = ({ item }: { item: GridItem }) => {
    const cardColors = [
      `${currentColors.primary}20`,
      `${currentColors.primary}30`,
      `${currentColors.primary}40`,
    ];
    const backgroundColor = cardColors[parseInt(item.id) % cardColors.length];

    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
        className="rounded-2xl border overflow-hidden"
        style={{ 
          backgroundColor: currentColors.surface,
          borderColor: currentColors.border,
          margin: sizes.cardSpacing / 2,
          height: item.height,
          shadowColor: currentColors.text.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
        focusable
        hitSlop={tvTokens.hitSlop}
        hasTVPreferredFocus={isTV && item.id === '1'}
      >
        {/* Card Content */}
        <View 
          className="justify-between p-4"
          style={{ 
            backgroundColor: backgroundColor,
            height: item.height,
          }}
        >
          {/* Top Section - Icon and Type */}
          <View className="flex-row justify-between items-start">
            <View 
              className="rounded-xl p-2"
              style={{
                backgroundColor: `${currentColors.primary}40`,
              }}
            >
              <MaterialIcons 
                name={item.type === 'playlist' ? 'queue-music' : 'music-note'} 
                size={sizes.iconSize + 4} 
                color={currentColors.primary} 
              />
            </View>
            
            {/* Play Button */}
            <TouchableOpacity
              className="w-9 h-9 rounded-full justify-center items-center"
              style={{
                backgroundColor: currentColors.primary,
                shadowColor: currentColors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={() => handleItemPress(item)}
            >
              <MaterialIcons 
                name="play-arrow" 
                size={sizes.iconSize} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Bottom Section - Text Content */}
          <View className="mt-auto">
            <CustomText 
              className="font-bold mb-1"
              style={{ 
                fontSize: sizes.fontSize + 1,
                color: currentColors.text.primary,
                lineHeight: sizes.fontSize + 6,
              }}
              numberOfLines={2}
            >
              {item.title}
            </CustomText>
            <CustomText 
              style={{ 
                fontSize: sizes.fontSize - 1,
                color: currentColors.text.secondary,
                lineHeight: sizes.fontSize + 2,
              }}
              numberOfLines={2}
            >
              {item.subtitle}
            </CustomText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <TabScreenWrapper>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ 
          paddingBottom: 100,
          paddingTop: sizes.headerMargin
        }}
        style={{ opacity: fadeAnim }}
      >
        {/* Search Section */}
        <View className="mb-5" style={{ paddingHorizontal: sizes.containerPadding, marginTop: sizes.headerMargin }}>
          <CustomText 
            className="font-bold mb-5"
            style={{ 
              color: currentColors.text.primary,
              fontSize: sizes.fontSize + 6,
            }}
          >
            Discover Music
          </CustomText>
          
          {/* Curved Search Container */}
          <Animated.View
            className="flex-row items-center border-2"
            style={[
              {
                height: sizes.searchHeight,
                borderRadius: sizes.searchBorderRadius,
                backgroundColor: currentColors.surface,
                borderColor: isSearchFocused ? currentColors.primary : currentColors.border,
                paddingHorizontal: 16,
                shadowColor: currentColors.text.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isSearchFocused ? 0.15 : 0.08,
                shadowRadius: isSearchFocused ? 12 : 8,
                elevation: isSearchFocused ? 8 : 4,
              },
              {
                transform: [{ scale: searchContainerScale }]
              }
            ]}
          >
            {/* Search Icon - Animated */}
            <Animated.View
              style={{
                opacity: searchIconAnim,
                transform: [{
                  scale: searchIconAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }}
            >
              <MaterialIcons 
                name="search" 
                size={sizes.iconSize} 
                color={isSearchFocused ? currentColors.primary : currentColors.text.secondary} 
              />
            </Animated.View>

            {/* Text Input */}
            <TextInput
              placeholder="Search songs, albums, artists..."
              placeholderTextColor={currentColors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="flex-1 py-2"
              style={{ 
                fontSize: sizes.fontSize,
                color: currentColors.text.primary,
                marginLeft: 12,
              }}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            {/* Search Button - Only shows when focused or has text */}
            {(isSearchFocused || searchQuery) && (
              <TouchableOpacity
                onPress={handleSearch}
                activeOpacity={0.8}
                className="px-4 py-2 ml-2"
                style={{
                  backgroundColor: currentColors.primary,
                  borderRadius: sizes.searchBorderRadius - 8,
                }}
              >
                <CustomText
                  className="text-white font-semibold"
                  style={{
                    fontSize: sizes.fontSize - 2,
                  }}
                >
                  Search
                </CustomText>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {/* Masonry Grid Section */}
        <View className="flex-1" style={{ paddingHorizontal: sizes.containerPadding, marginTop: 8 }}>
          <CustomText 
            className="font-bold mb-5"
            style={{ 
              color: currentColors.text.primary,
              fontSize: sizes.fontSize + 4,
            }}
          >
            Featured Playlists
          </CustomText>

          {/* FlashList for Masonry Layout */}
          <View style={{ minHeight: 800 }}>
            <FlashList
              data={gridItems}
              keyExtractor={(item) => item.id}
              numColumns={sizes.numColumns}
              renderItem={renderMasonryCard}
              showsVerticalScrollIndicator={false}
             // estimatedItemSize={sizes.baseCardHeight}
              scrollEnabled={false}
            />
          </View>
        </View>

        {/* Recent Songs Section */}
        <View style={{ marginTop: 24 }}>
          <RecentSongsSection />
        </View>

        {/* Empty space at bottom for better scrolling */}
        <View className="h-2" />
      </Animated.ScrollView>
    </TabScreenWrapper>
  );
}

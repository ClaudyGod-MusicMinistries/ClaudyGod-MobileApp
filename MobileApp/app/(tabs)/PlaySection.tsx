/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/play/PlaySection.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  useWindowDimensions,
  Keyboard 
} from "react-native";
import { MasonryList } from '@shopify/flash-list';
import { CustomButton } from '../../components/CustomButton';
import { useColorScheme } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { colors } from '../../constants/color';
import { MaterialIcons } from '@expo/vector-icons';

interface GridItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  type: 'song' | 'playlist' | 'album';
  height: number; // Dynamic height for masonry layout
}

export default function PlaySection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
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
        numColumns: 2
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
        numColumns: 2
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
        numColumns: 2
      };
    }
  };

  const sizes = getResponsiveSizes();

  // Sample data for the masonry grid with dynamic heights
  const gridItems: GridItem[] = [
    {
      id: '1',
      title: 'Worship Hits 2024',
      subtitle: 'Latest worship songs collection',
      imageUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 200 // Short card
    },
    {
      id: '2',
      title: 'Gospel Mix & Spiritual Upliftment',
      subtitle: 'Powerful gospel songs for your soul',
      imageUrl: 'https://images.unsplash.com/photo-1501281667305-0d4ebdb2c8e6?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 280 // Tall card
    },
    {
      id: '3',
      title: 'Prayer Time',
      subtitle: 'Songs for meditation and prayer',
      imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 240 // Medium card
    },
    {
      id: '4',
      title: 'Sunday Service Live Recording',
      subtitle: 'Complete Sunday worship experience',
      imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 320 // Very tall card
    },
    {
      id: '5',
      title: 'Kids Praise & Worship',
      subtitle: 'Fun songs for children',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 180 // Short card
    },
    {
      id: '6',
      title: 'Youth Anthem Revolution',
      subtitle: 'Modern worship for the youth',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 260 // Tall card
    },
    {
      id: '7',
      title: 'Healing Songs Collection',
      subtitle: 'Music for comfort and healing',
      imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 220 // Medium card
    },
    {
      id: '8',
      title: 'Christmas Joy & Celebration',
      subtitle: 'Festive songs for the holiday season',
      imageUrl: 'https://images.unsplash.com/photo-1544717301-9cdcb1f5940f?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 300 // Tall card
    },
    {
      id: '9',
      title: 'African Praise Beats',
      subtitle: 'Rhythmic African worship music',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 240 // Medium card
    },
    {
      id: '10',
      title: 'Evening Meditation',
      subtitle: 'Calming songs for your evening devotion',
      imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 280 // Tall card
    },
    {
      id: '11',
      title: 'Morning Devotion',
      subtitle: 'Start your day with uplifting music',
      imageUrl: 'https://images.unsplash.com/photo-1501281667305-0d4ebdb2c8e6?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 200 // Short card
    },
    {
      id: '12',
      title: 'Revival Fire',
      subtitle: 'Powerful songs for spiritual awakening',
      imageUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3',
      type: 'playlist',
      height: 340 // Very tall card
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
    // Implement search functionality
  };

  const handleItemPress = (item: GridItem) => {
    console.log('Item pressed:', item.title);
    // Navigate to item detail or play music
  };

  React.useEffect(() => {
    // Initial fade in animation
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
  const renderMasonryCard = ({ item, index }: { item: GridItem; index: number }) => {
    const cardColors = [
      currentColors.primary + '20',
      currentColors.primary + '30',
      currentColors.primary + '40',
    ];
    const backgroundColor = cardColors[index % cardColors.length];

    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
        style={{ 
          borderRadius: 20,
          backgroundColor: currentColors.surface,
          margin: sizes.cardSpacing / 2,
          shadowColor: currentColors.text.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: currentColors.border,
        }}
      >
        {/* Card Content */}
        <View 
          style={{ 
            height: item.height,
            backgroundColor: backgroundColor,
            justifyContent: 'space-between',
            padding: 16,
          }}
        >
          {/* Top Section - Icon and Type */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View 
              style={{
                backgroundColor: currentColors.primary + '40',
                borderRadius: 12,
                padding: 8,
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
              style={{
                backgroundColor: currentColors.primary,
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: currentColors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
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
          <View>
            <CustomText 
              style={{ 
                fontSize: sizes.fontSize + 1,
                fontWeight: '700',
                color: currentColors.text.primary,
                marginBottom: 6,
                lineHeight: sizes.fontSize + 4,
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

        {/* Gradient Overlay for better text readability */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            background: `linear-gradient(transparent, ${currentColors.surface})`,
          }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: currentColors.background }}>
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
      >
        {/* Search Section */}
        <View style={{ paddingHorizontal: sizes.containerPadding, marginTop: sizes.headerMargin }}>
          <CustomText 
            variant="heading" 
            style={{ 
              color: currentColors.text.primary,
              fontSize: sizes.fontSize + 6,
              fontWeight: '700',
              marginBottom: 20 
            }}
          >
            Discover Music
          </CustomText>
          
          {/* Curved Search Container */}
          <Animated.View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                height: sizes.searchHeight,
                borderRadius: sizes.searchBorderRadius,
                backgroundColor: currentColors.surface,
                borderWidth: 2,
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
              style={{ 
                flex: 1,
                marginLeft: 12,
                fontSize: sizes.fontSize,
                color: currentColors.text.primary,
                paddingVertical: 8,
              }}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            {/* Search Button - Only shows when focused or has text */}
            {(isSearchFocused || searchQuery) && (
              <TouchableOpacity
                onPress={handleSearch}
                activeOpacity={0.8}
                style={{
                  backgroundColor: currentColors.primary,
                  borderRadius: sizes.searchBorderRadius - 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginLeft: 8,
                }}
              >
                <CustomText
                  style={{
                    color: 'white',
                    fontSize: sizes.fontSize - 2,
                    fontWeight: '600',
                  }}
                >
                  Search
                </CustomText>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {/* Masonry Grid Section */}
        <View style={{ paddingHorizontal: sizes.containerPadding, marginTop: 32 }}>
          <CustomText 
            style={{ 
              color: currentColors.text.primary,
              fontSize: sizes.fontSize + 4,
              fontWeight: '700',
              marginBottom: 20
            }}
          >
            Featured Playlists
          </CustomText>

          {/* Masonry List */}
          <MasonryList
            data={gridItems}
            keyExtractor={(item: { id: any; }) => item.id}
            numColumns={sizes.numColumns}
            renderItem={renderMasonryCard}
            showsVerticalScrollIndicator={false}
            estimatedItemSize={200}
            contentContainerStyle={{
              paddingBottom: 20,
            }}
          />
        </View>

        {/* Empty space at bottom for better scrolling */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}
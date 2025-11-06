/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(tabs)/Favourites.tsx
import React, { useState } from 'react';
import { 
  View, 
  ScrollView,
  TouchableOpacity,
  useWindowDimensions
} from "react-native";
import { CustomText } from '../../components/CustomText';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { MaterialIcons } from '@expo/vector-icons';
import { TabScreenWrapper } from './TextWrapper';
import { TopAnimatedSection } from '../../components/topAnimatedFrame';
import { PlaylistGrid, SongList } from '../../components/musicPlaylist';
import { favouriteSongs, favouritePlaylists, recentlyAdded } from '../../data/data';
import type { Song } from '../../components/musicPlaylist';

export default function Favourites() {
  const [activeTab, setActiveTab] = useState<'favourites' | 'recent'>('favourites');
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // Responsive calculations
  const getResponsiveSizes = () => {
    if (SCREEN_WIDTH < 375) {
      return {
        containerPadding: 16,
        iconSize: 18,
        fontSize: 14,
        headerMargin: 8,
      };
    } else if (SCREEN_WIDTH < 414) {
      return {
        containerPadding: 20,
        iconSize: 20,
        fontSize: 15,
        headerMargin: 12,
      };
    } else {
      return {
        containerPadding: 24,
        iconSize: 22,
        fontSize: 16,
        headerMargin: 16,
      };
    }
  };

  const sizes = getResponsiveSizes();

  const handleRemoveFavourite = (song: Song) => {
    console.log('Remove favourite:', song.id);
  };

  const handlePlayAll = () => {
    console.log('Play all favourites');
  };

  const handleSongPress = (song: Song) => {
    console.log('Song pressed:', song);
  };

  const handlePlaylistPress = (playlist: any) => {
    console.log('Playlist pressed:', playlist);
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: 100,
          paddingTop: sizes.headerMargin
        }}
      >
        {/* Top Animated Section */}
        <TopAnimatedSection />

        {/* Header Section */}
        <View style={{ paddingHorizontal: sizes.containerPadding, marginTop: sizes.headerMargin }}>
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <CustomText 
                className="font-bold"
                style={{ 
                  color: currentColors.text.primary,
                  fontSize: sizes.fontSize + 6,
                }}
              >
                My Library
              </CustomText>
              <CustomText 
                style={{ 
                  color: currentColors.text.secondary,
                  fontSize: sizes.fontSize,
                }}
              >
                Your favorite songs and playlists
              </CustomText>
            </View>
            <TouchableOpacity
              onPress={handlePlayAll}
              className="flex-row items-center px-4 py-2 rounded-2xl"
              style={{ backgroundColor: currentColors.primary }}
            >
              <MaterialIcons name="play-arrow" size={sizes.iconSize} color="white" />
              <CustomText 
                className="ml-2 font-semibold"
                style={{ color: 'white', fontSize: sizes.fontSize }}
              >
                Play All
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row mb-6 rounded-2xl p-1" style={{ backgroundColor: currentColors.surface }}>
            <TouchableOpacity
              onPress={() => setActiveTab('favourites')}
              className={`flex-1 py-3 rounded-2xl ${activeTab === 'favourites' ? '' : ''}`}
              style={{ 
                backgroundColor: activeTab === 'favourites' ? currentColors.primary : 'transparent',
                alignItems: 'center',
              }}
            >
              <CustomText 
                className="font-semibold"
                style={{ 
                  color: activeTab === 'favourites' ? 'white' : currentColors.text.primary,
                  fontSize: sizes.fontSize,
                }}
              >
                Favourites ({favouriteSongs.length})
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('recent')}
              className={`flex-1 py-3 rounded-2xl ${activeTab === 'recent' ? '' : ''}`}
              style={{ 
                backgroundColor: activeTab === 'recent' ? currentColors.primary : 'transparent',
                alignItems: 'center',
              }}
            >
              <CustomText 
                className="font-semibold"
                style={{ 
                  color: activeTab === 'recent' ? 'white' : currentColors.text.primary,
                  fontSize: sizes.fontSize,
                }}
              >
                Recently Added ({recentlyAdded.length})
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          {activeTab === 'favourites' ? (
            <View>
              {/* Favourite Songs */}
              <View className="mb-8">
                <CustomText 
                  className="font-bold mb-4"
                  style={{ 
                    color: currentColors.text.primary,
                    fontSize: sizes.fontSize + 2,
                  }}
                >
                  Favourite Songs
                </CustomText>
                <SongList 
                  songs={favouriteSongs}
                  onSongPress={handleSongPress}
                  showActions={true}
                  onRemove={handleRemoveFavourite}
                />
              </View>

              {/* Favourite Playlists */}
              <View>
                <CustomText 
                  className="font-bold mb-4"
                  style={{ 
                    color: currentColors.text.primary,
                    fontSize: sizes.fontSize + 2,
                  }}
                >
                  Favourite Playlists
                </CustomText>
                <PlaylistGrid 
                  playlists={favouritePlaylists}
                  onPlaylistPress={handlePlaylistPress}
                />
              </View>
            </View>
          ) : (
            <View>
              {/* Recently Added Songs */}
              <View>
                <CustomText 
                  className="font-bold mb-4"
                  style={{ 
                    color: currentColors.text.primary,
                    fontSize: sizes.fontSize + 2,
                  }}
                >
                  Recently Added
                </CustomText>
                <SongList 
                  songs={recentlyAdded}
                  onSongPress={handleSongPress}
                  showActions={false}
                />
              </View>
            </View>
          )}
        </View>

        {/* Empty space at bottom for better scrolling */}
        <View className="h-10" />
      </ScrollView>
    </TabScreenWrapper>
  );
}
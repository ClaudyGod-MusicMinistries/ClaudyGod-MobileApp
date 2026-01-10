/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(tabs)/home.tsx
import { ScrollView, View, useWindowDimensions, TouchableOpacity } from "react-native";
import { CustomText } from "../../components/CustomText";
import { PlaylistGrid } from "../../components/musicPlaylist";
import { featuredPlaylists } from "../../data/data";
import { TopAnimatedSection } from "../../components/topAnimatedFrame";
import { CustomButton } from "../../components/CustomButton";
import { useColorScheme } from "../../util/colorScheme";
import { colors } from "../../constants/color";
import { MaterialIcons } from '@expo/vector-icons';
import { RecentSongsSection } from "../../components/RecentSongs";
import { TabScreenWrapper } from "./TextWrapper";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // Responsive padding and spacing
  const getResponsiveSpacing = () => {
    if (SCREEN_WIDTH < 375) {
      return { 
        containerPadding: 16,
        paddingBottom: 80, 
        paddingTop: 4, 
        sectionSpacing: 20,
        cardPadding: 16,
        buttonPadding: 12,
        headerMargin: 8,
      };
    } else if (SCREEN_WIDTH < 414) {
      return { 
        containerPadding: 20,
        paddingBottom: 90, 
        paddingTop: 6, 
        sectionSpacing: 24,
        cardPadding: 20,
        buttonPadding: 14,
        headerMargin: 12,
      };
    } else {
      return { 
        containerPadding: 24,
        paddingBottom: 100, 
        paddingTop: 8, 
        sectionSpacing: 24,
        cardPadding: 24,
        buttonPadding: 16,
        headerMargin: 16,
      };
    }
  };

  const spacing = getResponsiveSpacing();

  // Responsive font sizes
  const getResponsiveFontSize = () => {
    if (SCREEN_WIDTH < 375) {
      return { heading: 20, subheading: 16, body: 14, caption: 12, icon: 14 };
    } else if (SCREEN_WIDTH < 414) {
      return { heading: 22, subheading: 17, body: 15, caption: 13, icon: 15 };
    } else {
      return { heading: 24, subheading: 18, body: 16, caption: 14, icon: 16 };
    }
  };

  const fontSize = getResponsiveFontSize();

  const handleViewAll = (section: string) => {
    console.log('View all pressed for:', section);
  };

  const handlePlaylistPress = (playlist: any) => {
    console.log('Playlist pressed:', playlist);
  };

  const handleArtistPress = (artist: string) => {
    console.log('Artist pressed:', artist);
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: spacing.paddingBottom,
          paddingTop: spacing.paddingTop,
        }}
        style={{ flex: 1 }}
      >
        {/* Top Animated Section */}
        <TopAnimatedSection />

        {/* Welcome Header */}
        <View style={{ paddingHorizontal: spacing.containerPadding, marginTop: spacing.headerMargin, marginBottom: spacing.sectionSpacing }}>
          <CustomText 
            className="font-bold"
            style={{ 
              color: currentColors.text.primary,
              fontSize: fontSize.heading,
              marginBottom: 8,
            }}
          >
            Welcome Back
          </CustomText>
          <CustomText 
            style={{ 
              color: currentColors.text.secondary,
              fontSize: fontSize.body,
            }}
          >
            Ready for some amazing music?
          </CustomText>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing.containerPadding, marginBottom: spacing.sectionSpacing }}>
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 mr-2 rounded-2xl p-4"
              style={{ backgroundColor: `${currentColors.primary}20` }}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="favorite" size={24} color={currentColors.primary} />
                <View className="ml-3">
                  <CustomText style={{ fontSize: fontSize.subheading, color: currentColors.text.primary, fontWeight: '600' }}>
                    Favorites
                  </CustomText>
                  <CustomText style={{ fontSize: fontSize.caption, color: currentColors.text.secondary }}>
                    Your loved songs
                  </CustomText>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 ml-2 rounded-2xl p-4"
              style={{ backgroundColor: `${currentColors.primary}20` }}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="history" size={24} color={currentColors.primary} />
                <View className="ml-3">
                  <CustomText style={{ fontSize: fontSize.subheading, color: currentColors.text.primary, fontWeight: '600' }}>
                    Recent
                  </CustomText>
                  <CustomText style={{ fontSize: fontSize.caption, color: currentColors.text.secondary }}>
                    Recently played
                  </CustomText>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Playlists Section */}
        <View style={{ paddingHorizontal: spacing.containerPadding, marginBottom: spacing.sectionSpacing }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <CustomText style={{ fontSize: fontSize.subheading, fontWeight: 'bold', color: currentColors.text.primary }}>
              Featured Playlists
            </CustomText>
            <CustomButton
              variant="text"
              onPress={() => handleViewAll('featured')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CustomText
                  style={{ 
                    fontSize: fontSize.caption,
                    color: currentColors.primary, 
                    marginRight: 4 
                  }}
                >
                  View All
                </CustomText>
                <MaterialIcons name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
              </View>
            </CustomButton>
          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists}
            onPlaylistPress={handlePlaylistPress}
          />
        </View>

        {/* Recent Songs Section */}
        <RecentSongsSection />

        {/* ClaudyGod's Nugget of Truth Section */}
        <View style={{ paddingHorizontal: spacing.containerPadding, marginBottom: spacing.sectionSpacing }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <CustomText style={{ fontSize: fontSize.subheading, fontWeight: 'bold', color: currentColors.text.primary }}>
              ClaudyGod's Nugget of Truth
            </CustomText>
            <CustomButton
              variant="text"
              onPress={() => handleViewAll('nuggets')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CustomText
                  style={{ 
                    fontSize: fontSize.caption,
                    color: currentColors.primary, 
                    marginRight: 4 
                  }}
                >
                  View All
                </CustomText>
                <MaterialIcons name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
              </View>
            </CustomButton>
          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists.slice(0, 2)}
            onPlaylistPress={handlePlaylistPress}
          />
        </View>

        {/* ClaudyGod Kids & Teens Channel Section */}
        <View style={{ paddingHorizontal: spacing.containerPadding, marginBottom: spacing.sectionSpacing }}>
          <View 
            style={{ 
              borderRadius: 16, 
              padding: spacing.cardPadding,
              backgroundColor: currentColors.surface,
              borderWidth: 1,
              borderColor: currentColors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <CustomText style={{ fontSize: fontSize.subheading, fontWeight: 'bold', color: currentColors.text.primary }}>
                ClaudyGod Kids & Teens Channel
              </CustomText>
              <CustomButton
                variant="text"
                onPress={() => handleViewAll('kids')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CustomText
                    style={{ 
                      fontSize: fontSize.caption,
                      color: currentColors.primary, 
                      marginRight: 4 
                    }}
                  >
                    View All
                  </CustomText>
                  <MaterialIcons name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
                </View>
              </CustomButton>
            </View>
            <PlaylistGrid 
              playlists={featuredPlaylists.slice(0, 3)}
              onPlaylistPress={handlePlaylistPress}
            />
          </View>
        </View>

        {/* ClaudyGod Audio Section */}
        <View style={{ paddingHorizontal: spacing.containerPadding, marginBottom: spacing.sectionSpacing }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <CustomText style={{ fontSize: fontSize.subheading, fontWeight: 'bold', color: currentColors.text.primary }}>
              ClaudyGod Audio
            </CustomText>
            <CustomButton
              variant="text"
              onPress={() => handleViewAll('audio')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CustomText
                  style={{ 
                    fontSize: fontSize.caption,
                    color: currentColors.primary, 
                    marginRight: 4 
                  }}
                >
                  View All
                </CustomText>
                <MaterialIcons name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
              </View>
            </CustomButton>
          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists.slice(0, 2)}
            onPlaylistPress={handlePlaylistPress}
          />
        </View>

        {/* ClaudyGod Teaching's Section */}
        <View style={{ paddingHorizontal: spacing.containerPadding, marginBottom: spacing.sectionSpacing }}>
          <View 
            style={{ 
              borderRadius: 16, 
              padding: spacing.cardPadding,
              backgroundColor: currentColors.surface,
              borderWidth: 1,
              borderColor: currentColors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <CustomText style={{ fontSize: fontSize.subheading, fontWeight: 'bold', color: currentColors.text.primary }}>
                ClaudyGod Teaching's
              </CustomText>
              <CustomButton
                variant="text"
                onPress={() => handleViewAll('teachings')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CustomText
                    style={{ 
                      fontSize: fontSize.caption,
                      color: currentColors.primary, 
                      marginRight: 4 
                    }}
                  >
                    View All
                  </CustomText>
                  <MaterialIcons name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
                </View>
              </CustomButton>
            </View>
            <PlaylistGrid 
              playlists={featuredPlaylists.slice(0, 2)}
              onPlaylistPress={handlePlaylistPress}
            />
          </View>
        </View>

        {/* Popular Artists Section */}
        <View style={{ paddingHorizontal: spacing.containerPadding, marginBottom: spacing.sectionSpacing }}>
          <CustomText 
            className="font-bold mb-4"
            style={{ 
              fontSize: fontSize.subheading, 
              color: currentColors.text.primary,
            }}
          >
            Popular Artists
          </CustomText>
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => handleArtistPress('Artist 1')}
              className="flex-1 mr-2 rounded-2xl border p-4"
              style={{ 
                backgroundColor: currentColors.surface,
                borderColor: currentColors.border,
              }}
            >
              <View className="items-center">
                <View className="w-12 h-12 rounded-full mb-2 items-center justify-center" 
                  style={{ backgroundColor: `${currentColors.primary}20` }}>
                  <MaterialIcons name="person" size={24} color={currentColors.primary} />
                </View>
                <CustomText style={{ fontSize: fontSize.body, color: currentColors.text.primary, textAlign: 'center' }}>
                  Artist 1
                </CustomText>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleArtistPress('Artist 2')}
              className="flex-1 ml-2 rounded-2xl border p-4"
              style={{ 
                backgroundColor: currentColors.surface,
                borderColor: currentColors.border,
              }}
            >
              <View className="items-center">
                <View className="w-12 h-12 rounded-full mb-2 items-center justify-center" 
                  style={{ backgroundColor: `${currentColors.primary}20` }}>
                  <MaterialIcons name="person" size={24} color={currentColors.primary} />
                </View>
                <CustomText style={{ fontSize: fontSize.body, color: currentColors.text.primary, textAlign: 'center' }}>
                  Artist 2
                </CustomText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty space at bottom for better scrolling */}
        <View className="h-24" />
      </ScrollView>
    </TabScreenWrapper>
  );
}
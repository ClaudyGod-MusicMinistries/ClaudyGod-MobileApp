/* eslint-disable @typescript-eslint/no-unused-vars */
import { View, StatusBar, ScrollView } from "react-native";
import { Container } from "../../components/Container";
import { CustomText } from "../../components/CustomText";
// import { NowPlayingCard } from "../../components/Card";
import { PlaylistGrid } from "../../components/musicPlaylist";
import { SongList } from "../../components/musicPlaylist";
import { currentSong, featuredPlaylists, recentSongs } from "../../data/data";
import { TopAnimatedSection } from "../../components/topAnimatedFrame";
import { CustomButton } from "../../components/CustomButton";
import { useColorScheme } from "../../util/colorScheme";
import { colors } from "../../constants/color";
import Icon from 'react-native-vector-icons/Feather';
import { RecentSongsSection } from "../../components/RecentSongs";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
      >
        {/* Top Animated Section */}
        <TopAnimatedSection />

        {/* Now Playing Section with proper spacing */}
        {/* <Container className="mt-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <CustomText variant="heading" style={{ color: currentColors.text.primary }}>
              Now Playing
            </CustomText>
            <CustomButton
              variant="text"
              onPress={() => console.log('View all now playing')}
            >
              <View className="flex-row items-center">
                <CustomText variant="body" style={{ color: currentColors.primary, marginRight: 4 }}>
                  View All
                </CustomText>
                <Icon name="arrow-right" size={16} color={currentColors.primary} />
              </View>
            </CustomButton>
          </View>
          <NowPlayingCard 
            song={currentSong}
            isPlaying={true}
            onPlayPause={() => console.log('Play/Pause')}
          />
        </Container> */}

        {/* Featured Playlists Section */}
        <Container className="mb-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
   <CustomText variant="heading" style={{ fontSize: 18 }}>
  ClaudyGod Music
</CustomText>
       <CustomButton
  variant="text"
  onPress={() => console.log('View all playlists')}>
  <View className="flex-row items-center">
    <CustomText
      variant="caption"
      style={{ color: currentColors.primary, marginRight: 4 }}
    >
      View All
    </CustomText>

    <Icon name="arrow-right" size={16} color={currentColors.primary} />
  </View>
</CustomButton>

          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists}
            onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
          />
        </Container>

        {/* Recent Songs Section */}

<RecentSongsSection />

 <Container className="mb-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
   <CustomText variant="heading" style={{ fontSize: 18 }}>
  ClaudyGod's Nugget of Truth
</CustomText>
      <CustomButton
  variant="text"
  onPress={() => console.log('View all playlists')}>
  <View className="flex-row items-center">
    <CustomText
      variant="caption"
      style={{ color: currentColors.primary, marginRight: 4 }}
    >
      View All
    </CustomText>

    <Icon name="arrow-right" size={16} color={currentColors.primary} />
  </View>
</CustomButton>

          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists}
            onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
          />
        </Container>
         <Container className="mb-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
    <CustomText variant="heading" style={{ fontSize: 18 }}>
  ClaudyGod Kids & teens Channel
</CustomText>
       <CustomButton
  variant="text"
  onPress={() => console.log('View all playlists')}>
  <View className="flex-row items-center">
    <CustomText
      variant="caption"
      style={{ color: currentColors.primary, marginRight: 4 }}
    >
      View All
    </CustomText>

    <Icon name="arrow-right" size={16} color={currentColors.primary} />
  </View>
</CustomButton>

          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists}
            onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
          />
        </Container>
         <Container className="mb-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
   <CustomText variant="heading" style={{ fontSize: 18 }}>
  ClaudyGod Audio
</CustomText>
       <CustomButton
  variant="text"
  onPress={() => console.log('View all playlists')}>
  <View className="flex-row items-center">
    <CustomText
      variant="caption"
      style={{ color: currentColors.primary, marginRight: 4 }}
    >
      View All
    </CustomText>

    <Icon name="arrow-right" size={16} color={currentColors.primary} />
  </View>
</CustomButton>

          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists}
            onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
          />
        </Container>
        {/* For You Section */}
        <Container className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <CustomText variant="heading" style={{ fontSize: 18 }}>
              ClaudyGod Teaching's
            </CustomText>
               <CustomButton
  variant="text"
  onPress={() => console.log('View all playlists')}>
  <View className="flex-row items-center">
    <CustomText
      variant="caption"
      style={{ color: currentColors.primary, marginRight: 4 }}
    >
      View All
    </CustomText>

    <Icon name="arrow-right" size={16} color={currentColors.primary} />
  </View>
</CustomButton>
          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists.slice(0, 2)}
            onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
          />
        </Container>

        {/* Popular Artists Section */}
        <Container className="mb-6">
          <CustomText variant="heading" style={{ color: currentColors.text.primary }} className="mb-4">
            Popular Artists
          </CustomText>
          <View className="flex-row justify-between">
            <CustomButton
              variant="outline"
              onPress={() => console.log('Artist 1')}
              style={{ flex: 1, marginRight: 8 }}
            >
              Artist 1
            </CustomButton>
            <CustomButton
              variant="outline"
              onPress={() => console.log('Artist 2')}
              style={{ flex: 1, marginLeft: 8 }}
            >
              Artist 2
            </CustomButton>
          </View>
        </Container>
      </ScrollView>
    </View>
  );
}
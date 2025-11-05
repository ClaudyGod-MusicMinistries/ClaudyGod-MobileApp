import { View, StatusBar, ScrollView } from "react-native";
import { Container } from "../../components/Container";
import { CustomText } from "../../components/CustomText";
import { NowPlayingCard } from "../../components/Card";
import { PlaylistGrid } from "../../components/musicPlaylist";
import { SongList } from "../../components/musicPlaylist";
import { currentSong,featuredPlaylists,recentSongs } from "../../data/data";
import { TopAnimatedSection } from "../../components/topAnimatedFrame";


export default function HomeScreen() {
  // Mock data - replace with actual data

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
      >
        {/* Now Playing */}
        
  <TopAnimatedSection />

        {/* Featured Playlists */}
        <Container className="mb-6">
          <CustomText variant="heading" className="text-white mb-4">
            Featured Playlists
          </CustomText>
          <PlaylistGrid 
            playlists={featuredPlaylists}
            onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
          />
        </Container>

        {/* Recent Songs */}
        <Container className="mb-6">
          <CustomText variant="heading" className="text-white mb-4">
            Recent Songs
          </CustomText>
          <SongList 
            songs={recentSongs}
            onSongPress={(song) => console.log('Song pressed:', song)}
            currentSongId="1"
          />
        </Container>
         <NowPlayingCard 
          song={currentSong}
          isPlaying={true}
          onPlayPause={() => console.log('Play/Pause')}
        />

        {/* Featured Playlists */}
        <Container className="mb-6">
          <CustomText variant="heading" className="text-white mb-4">
            Featured Playlists
          </CustomText>
          <PlaylistGrid 
            playlists={featuredPlaylists}
            onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
          />
        </Container>

        {/* Recent Songs */}
        <Container className="mb-6">
          <CustomText variant="heading" className="text-white mb-4">
            Recent Songs
          </CustomText>
          <SongList 
            songs={recentSongs}
            onSongPress={(song) => console.log('Song pressed:', song)}
            currentSongId="1"
          />
        </Container>
      </ScrollView>
    </View>
  );
}
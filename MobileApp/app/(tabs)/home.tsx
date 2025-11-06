/* eslint-disable @typescript-eslint/no-unused-vars */
import { ScrollView, View, useWindowDimensions } from "react-native";
import { Container } from "../../components/Container";
import { CustomText } from "../../components/CustomText";
import { PlaylistGrid } from "../../components/musicPlaylist";
import { featuredPlaylists } from "../../data/data";
import { TopAnimatedSection } from "../../components/topAnimatedFrame";
import { CustomButton } from "../../components/CustomButton";
import { useColorScheme } from "../../util/colorScheme";
import { colors } from "../../constants/color";
import Icon from 'react-native-vector-icons/Feather';
import { RecentSongsSection } from "../../components/RecentSongs";
import { TabScreenWrapper } from "./TextWrapper";


export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  // Responsive padding and spacing
  const getResponsiveSpacing = () => {
    if (SCREEN_WIDTH < 375) {
      return { 
        paddingBottom: 80, 
        paddingTop: 4, 
        sectionSpacing: 20,
        cardPadding: 16,
        buttonPadding: 12
      };
    } else if (SCREEN_WIDTH < 414) {
      return { 
        paddingBottom: 90, 
        paddingTop: 6, 
        sectionSpacing: 24,
        cardPadding: 20,
        buttonPadding: 14
      };
    } else {
      return { 
        paddingBottom: 100, 
        paddingTop: 8, 
        sectionSpacing: 24,
        cardPadding: 24,
        buttonPadding: 16
      };
    }
  };

  const spacing = getResponsiveSpacing();

  // Responsive font sizes
  const getResponsiveFontSize = () => {
    if (SCREEN_WIDTH < 375) {
      return { heading: 16, body: 14, caption: 12, icon: 14 };
    } else if (SCREEN_WIDTH < 414) {
      return { heading: 17, body: 15, caption: 13, icon: 15 };
    } else {
      return { heading: 18, body: 16, caption: 14, icon: 16 };
    }
  };

  const fontSize = getResponsiveFontSize();

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

        {/* Featured Playlists Section */}
        <Container style={{ marginBottom: spacing.sectionSpacing, marginTop: spacing.sectionSpacing }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <CustomText style={{ fontSize: fontSize.heading, fontWeight: 'bold', color: currentColors.text.primary }}>
              ClaudyGod Music
            </CustomText>
            <CustomButton
              variant="text"
              onPress={() => console.log('View all playlists')}
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
                <Icon name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
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

        {/* ClaudyGod's Nugget of Truth Section */}
        <Container style={{ marginBottom: spacing.sectionSpacing, marginTop: spacing.sectionSpacing }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <CustomText style={{ fontSize: fontSize.heading, fontWeight: 'bold', color: currentColors.text.primary }}>
              ClaudyGod's Nugget of Truth
            </CustomText>
            <CustomButton
              variant="text"
              onPress={() => console.log('View all playlists')}
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
                <Icon name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
              </View>
            </CustomButton>
          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists}
            onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
          />
        </Container>

        {/* ClaudyGod Kids & Teens Channel Section */}
        <Container style={{ marginBottom: spacing.sectionSpacing, marginTop: spacing.sectionSpacing }}>
          <View 
            style={{ 
              borderRadius: 16, 
              padding: spacing.cardPadding,
              backgroundColor: currentColors.surface 
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <CustomText style={{ fontSize: fontSize.heading, fontWeight: 'bold', color: currentColors.text.primary }}>
                ClaudyGod Kids & Teens Channel
              </CustomText>
              <CustomButton
                variant="text"
                onPress={() => console.log('View all playlists')}
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
                  <Icon name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
                </View>
              </CustomButton>
            </View>
            <PlaylistGrid 
              playlists={featuredPlaylists}
              onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
            />
          </View>
        </Container>

        {/* ClaudyGod Audio Section */}
        <Container style={{ marginBottom: spacing.sectionSpacing, marginTop: spacing.sectionSpacing }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <CustomText style={{ fontSize: fontSize.heading, fontWeight: 'bold', color: currentColors.text.primary }}>
              ClaudyGod Audio
            </CustomText>
            <CustomButton
              variant="text"
              onPress={() => console.log('View all playlists')}
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
                <Icon name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
              </View>
            </CustomButton>
          </View>
          <PlaylistGrid 
            playlists={featuredPlaylists}
            onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
          />
        </Container>

        {/* ClaudyGod Teaching's Section */}
        <Container style={{ marginBottom: spacing.sectionSpacing, marginTop: spacing.sectionSpacing }}>
          <View 
            style={{ 
              borderRadius: 16, 
              padding: spacing.cardPadding,
              backgroundColor: currentColors.surface 
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <CustomText style={{ fontSize: fontSize.heading, fontWeight: 'bold', color: currentColors.text.primary }}>
                ClaudyGod Teaching's
              </CustomText>
              <CustomButton
                variant="text"
                onPress={() => console.log('View all playlists')}
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
                  <Icon name="arrow-right" size={fontSize.icon} color={currentColors.primary} />
                </View>
              </CustomButton>
            </View>
            <PlaylistGrid 
              playlists={featuredPlaylists.slice(0, 2)}
              onPlaylistPress={(playlist) => console.log('Playlist pressed:', playlist)}
            />
          </View>
        </Container>

        {/* Popular Artists Section */}
        <Container style={{ marginBottom: spacing.sectionSpacing }}>
          <CustomText style={{ 
            fontSize: fontSize.heading, 
            fontWeight: 'bold', 
            color: currentColors.text.primary,
            marginBottom: 16 
          }}>
            Popular Artists
          </CustomText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <CustomButton
              variant="outline"
              onPress={() => console.log('Artist 1')}
              style={{ 
                flex: 1, 
                marginRight: 8,
                paddingVertical: spacing.buttonPadding
              }}
            >
              <CustomText style={{ fontSize: fontSize.body, color: currentColors.text.primary }}>
                Artist 1
              </CustomText>
            </CustomButton>
            <CustomButton
              variant="outline"
              onPress={() => console.log('Artist 2')}
              style={{ 
                flex: 1, 
                marginLeft: 8,
                paddingVertical: spacing.buttonPadding
              }}
            >
              <CustomText style={{ fontSize: fontSize.body, color: currentColors.text.primary }}>
                Artist 2
              </CustomText>
            </CustomButton>
          </View>
        </Container>
      </ScrollView>
    </TabScreenWrapper>
  );
}
// app/(tabs)/Favourites.tsx
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../../components/CustomText';
import { Chip } from '../../components/ui/Chip';
import { MediaRail } from '../../components/sections/MediaRail';
import { PosterCard } from '../../components/ui/PosterCard';
import { favouritePlaylists, favouriteSongs, recentlyAdded } from '../../data/data';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '../../components/layout/Screen';

export default function Favourites() {
  const theme = useAppTheme();
  const [tab, setTab] = useState<'library' | 'recent' | 'downloads'>('library');

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: theme.spacing.md }}
      >
        <Screen>
          <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 18 }}>
            Your Library
          </CustomText>
          <CustomText style={{ color: theme.colors.text.secondary, marginTop: 2, fontSize: 11 }}>
            Favorites, playlists, and offline downloads.
          </CustomText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: theme.spacing.sm }}
          >
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Chip label="Library" active={tab === 'library'} onPress={() => setTab('library')} />
              <Chip label="Recent" active={tab === 'recent'} onPress={() => setTab('recent')} />
              <Chip label="Downloads" active={tab === 'downloads'} onPress={() => setTab('downloads')} />
            </View>
          </ScrollView>

          {tab === 'library' && (
            <>
              <View style={{ marginTop: theme.spacing.md }}>
                <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 15 }}>
                  Quick actions
                </CustomText>
                <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.sm }}>
                  {[
                    { icon: 'shuffle', label: 'Shuffle' },
                    { icon: 'download', label: 'Download' },
                    { icon: 'playlist-add', label: 'New Playlist' },
                  ].map((action) => (
                    <TouchableOpacity
                      key={action.label}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                        borderRadius: 8,
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <MaterialIcons name={action.icon as any} size={16} color={theme.colors.primary} />
                      <CustomText style={{ color: theme.colors.text.primary, marginLeft: 8, fontSize: 12 }}>
                        {action.label}
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginTop: theme.spacing.md }}>
                <MediaRail
                  title="Favourite playlists"
                  actionLabel="Manage"
                  onAction={() => console.log('Manage playlists')}
                  data={favouritePlaylists}
                  renderItem={(playlist) => (
                    <PosterCard
                      key={playlist.id}
                      imageUrl={playlist.imageUrl}
                      title={playlist.title}
                      subtitle={`${playlist.songCount} songs`}
                      onPress={() => console.log('Open playlist', playlist.id)}
                      size="sm"
                    />
                  )}
                />
              </View>

              <View style={{ marginTop: theme.spacing.md }}>
                <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 15 }}>
                  Favourite songs
                </CustomText>
                <View
                  style={{
                    marginTop: theme.spacing.sm,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  {favouriteSongs.slice(0, 5).map((song) => (
                    <TouchableOpacity
                      key={song.id}
                      onPress={() => console.log('Play song', song.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: theme.spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 6,
                          backgroundColor: `${theme.colors.primary}22`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: theme.spacing.md,
                        }}
                      >
                        <MaterialIcons name="music-note" size={18} color={theme.colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomText style={{ color: theme.colors.text.primary }}>{song.title}</CustomText>
                        <CustomText style={{ color: theme.colors.text.secondary, fontSize: 12 }}>{song.artist}</CustomText>
                      </View>
                      <MaterialIcons name="play-arrow" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {tab === 'recent' && (
            <MediaRail
              title="Recently added"
              actionLabel="Clear"
              onAction={() => console.log('Clear recent')}
              data={recentlyAdded}
              renderItem={(song) => (
                <PosterCard
                  key={song.id}
                  imageUrl={song.imageUrl}
                  title={song.title}
                  subtitle={song.artist}
                  size="sm"
                  onPress={() => console.log('Play recent', song.id)}
                />
              )}
            />
          )}

          {tab === 'downloads' && (
            <View
              style={{
                marginTop: theme.spacing.lg,
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: theme.spacing.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 16 }}>
                Downloads
              </CustomText>
              <CustomText style={{ color: theme.colors.text.secondary, marginTop: 6, fontSize: 12 }}>
                No downloads yet. Tap the download icon on any song or playlist to listen offline.
              </CustomText>
            </View>
          )}
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

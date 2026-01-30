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

export default function Favourites() {
  const theme = useAppTheme();
  const [tab, setTab] = useState<'library' | 'recent' | 'downloads'>('library');

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: theme.spacing.md }}
      >
        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 24 }}>
            Your Library
          </CustomText>
          <CustomText style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
            Favorites, playlists, and offline downloads.
          </CustomText>

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Chip label="Library" active={tab === 'library'} onPress={() => setTab('library')} />
            <Chip label="Recent" active={tab === 'recent'} onPress={() => setTab('recent')} />
            <Chip label="Downloads" active={tab === 'downloads'} onPress={() => setTab('downloads')} />
          </View>

          {tab === 'library' && (
            <>
              <View style={{ marginTop: theme.spacing.lg }}>
                <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 18 }}>
                  Quick actions
                </CustomText>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
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
                        borderRadius: theme.radius.pill,
                        backgroundColor: `${theme.colors.primary}18`,
                        borderWidth: 1,
                        borderColor: `${theme.colors.primary}40`,
                      }}
                    >
                      <MaterialIcons name={action.icon as any} size={18} color={theme.colors.primary} />
                      <CustomText style={{ color: theme.colors.text.primary, marginLeft: 8 }}>
                        {action.label}
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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
                  />
                )}
              />

              <MediaRail
                title="Favourite songs"
                actionLabel="Play all"
                onAction={() => console.log('Play favourites')}
                data={favouriteSongs}
                renderItem={(song) => (
                  <PosterCard
                    key={song.id}
                    imageUrl={song.imageUrl}
                    title={song.title}
                    subtitle={song.artist}
                    size="sm"
                    onPress={() => console.log('Play song', song.id)}
                  />
                )}
              />
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
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <CustomText className="font-bold" style={{ color: theme.colors.text.primary, fontSize: 18 }}>
                Downloads
              </CustomText>
              <CustomText style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                No downloads yet. Tap the download icon on any song or playlist to listen offline.
              </CustomText>
            </View>
          )}
        </View>
      </ScrollView>
    </TabScreenWrapper>
  );
}

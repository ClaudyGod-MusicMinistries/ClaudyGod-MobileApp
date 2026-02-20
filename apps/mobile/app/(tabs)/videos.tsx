import React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabScreenWrapper } from './TextWrapper';
import { useAppTheme } from '../../util/colorScheme';
import { Screen } from '../../components/layout/Screen';
import { FadeIn } from '../../components/ui/FadeIn';
import { CustomText } from '../../components/CustomText';
import { TVTouchable } from '../../components/ui/TVTouchable';

const featured = {
  id: 'fv-1',
  title: 'Worship Night Experience',
  subtitle: 'ClaudyGod Worship Hour',
  duration: '23:19',
  imageUrl:
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
};

const quickVideos = [
  {
    id: 'qv-1',
    title: 'Nuggets of Truth #94',
    subtitle: '2:48',
    imageUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'qv-2',
    title: 'Youth Channel Clip',
    subtitle: '3:32',
    imageUrl:
      'https://images.unsplash.com/photo-1458560871784-56d23406c091?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'qv-3',
    title: 'Message Highlights',
    subtitle: '4:05',
    imageUrl:
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80',
  },
];

const playlists = [
  {
    id: 'vp-1',
    title: 'ClaudyGod Worship Hour',
    subtitle: '12 videos',
    imageUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'vp-2',
    title: 'Nuggets of Truth',
    subtitle: '54 videos',
    imageUrl:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'vp-3',
    title: 'Teens Youth Channel',
    subtitle: '21 videos',
    imageUrl:
      'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=900&q=80',
  },
];

export default function VideosScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <TabScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: theme.spacing.md, paddingBottom: 150 }}
      >
        <Screen>
          <FadeIn>
            <View
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
                  Videos
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                  Structured video workspace for all channels.
                </CustomText>
              </View>

              <TVTouchable
                onPress={() => router.push('/(tabs)/search')}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                showFocusBorder={false}
              >
                <MaterialIcons name="search" size={20} color={theme.colors.text.primary} />
              </TVTouchable>
            </View>
          </FadeIn>

          <FadeIn delay={70}>
            <TVTouchable
              onPress={() => router.push('/(tabs)/PlaySection')}
              style={{
                marginTop: 14,
                borderRadius: 22,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              }}
              showFocusBorder={false}
            >
              <Image source={{ uri: featured.imageUrl }} style={{ width: '100%', height: 220 }} />
              <LinearGradient
                colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.58)']}
                style={{ position: 'absolute', left: 0, right: 0, bottom: 70, height: 90 }}
              />
              <View
                style={{
                  position: 'absolute',
                  right: 14,
                  bottom: 86,
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(154,107,255,0.92)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="play-arrow" size={30} color="#FFFFFF" />
              </View>

              <View style={{ padding: 12 }}>
                <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                  {featured.title}
                </CustomText>
                <View
                  style={{
                    marginTop: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    {featured.subtitle}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: theme.colors.text.secondary }}>
                    {featured.duration}
                  </CustomText>
                </View>
              </View>
            </TVTouchable>
          </FadeIn>

          <FadeIn delay={110}>
            <View style={{ marginTop: 16 }}>
              <SectionHeader title="Quick Videos" actionLabel="See all" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {quickVideos.map((item) => (
                  <TVTouchable
                    key={item.id}
                    onPress={() => router.push('/(tabs)/PlaySection')}
                    style={{
                      width: 196,
                      marginRight: 10,
                      borderRadius: 16,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 116 }} />
                    <View style={{ padding: 10 }}>
                      <CustomText variant="body" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                        {item.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                        {item.subtitle}
                      </CustomText>
                    </View>
                  </TVTouchable>
                ))}
              </ScrollView>
            </View>
          </FadeIn>

          <FadeIn delay={140}>
            <View style={{ marginTop: 18 }}>
              <SectionHeader title="Channel Playlists" actionLabel="Manage" />
              <View style={{ gap: 9 }}>
                {playlists.map((item) => (
                  <TVTouchable
                    key={item.id}
                    onPress={() => router.push('/(tabs)/PlaySection')}
                    style={{
                      minHeight: 70,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      padding: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    showFocusBorder={false}
                  >
                    <Image source={{ uri: item.imageUrl }} style={{ width: 56, height: 56, borderRadius: 12 }} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                        {item.title}
                      </CustomText>
                      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 2 }}>
                        {item.subtitle}
                      </CustomText>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={theme.colors.text.secondary} />
                  </TVTouchable>
                ))}
              </View>
            </View>
          </FadeIn>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

function SectionHeader({ title, actionLabel }: { title: string; actionLabel: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>
        {title}
      </CustomText>
      <CustomText variant="label" style={{ color: theme.colors.primary }}>
        {actionLabel}
      </CustomText>
    </View>
  );
}

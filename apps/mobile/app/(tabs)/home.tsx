/**
 * Home Screen - Redesigned
 * Personalized content discovery with engagement-focused recommendations
 * Real-time trending, smart recommendations, and community features
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Animated,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { SmartContentRail } from '../../components/sections/SmartContentRail';

const COLORS = {
  background: '#0A0612',
  surface: 'rgba(26,20,47,0.50)',
  surfaceAlt: 'rgba(38,33,47,0.70)',
  border: 'rgba(167,139,250,0.15)',
  textPrimary: '#F5F3FF',
  textSecondary: 'rgba(184,180,212,0.70)',
  accent: '#A78BFA',
  success: '#10B981',
  warning: '#F59E0B',
};

// Trending pill component
function TrendingPill({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: isActive ? COLORS.accent : COLORS.surface,
        borderWidth: 1,
        borderColor: isActive ? COLORS.accent : COLORS.border,
        marginRight: 8,
      }}
    >
      <CustomText
        style={{
          color: isActive ? '#0A0612' : COLORS.textSecondary,
          fontSize: 12,
          fontWeight: '600',
        }}
      >
        {label}
      </CustomText>
    </Pressable>
  );
}

// Featured banner with live indicator
function FeaturedBanner({ title, plays, isLive }: { title: string; plays: number; isLive: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginHorizontal: 16, marginBottom: 24 }}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <LinearGradient
          colors={['rgba(167,139,250,0.2)', 'rgba(139,92,246,0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {isLive && (
                <>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#EF4444',
                    }}
                  />
                  <CustomText style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>
                    LIVE NOW
                  </CustomText>
                </>
              )}
            </View>
            <CustomText
              style={{
                color: COLORS.textPrimary,
                fontSize: 16,
                fontWeight: '700',
                marginBottom: 6,
              }}
              numberOfLines={2}
            >
              {title}
            </CustomText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialIcons name="play-arrow" size={14} color={COLORS.accent} />
              <CustomText style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                {plays > 1000 ? (plays / 1000).toFixed(1) + 'K' : plays} listening now
              </CustomText>
            </View>
          </View>

          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              backgroundColor: COLORS.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="play-arrow" size={24} color="#0A0612" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const railCardSize = width < 430 ? 'sm' : 'md';
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const dummyContent = [
    { id: '1', title: 'Morning Worship Mix', author: 'ClaudyGod', plays: 12450, likes: 890 },
    { id: '2', title: 'Gospel Classics', author: 'Faith Station', plays: 5620, likes: 445 },
    { id: '3', title: 'Contemporary Worship', author: 'Worship Central', plays: 8930, likes: 672 },
    { id: '4', title: 'Prayer & Meditation', author: 'Spiritual Journey', plays: 3240, likes: 298 },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LinearGradient
        colors={['rgba(167,139,250,0.15)', 'rgba(167,139,250,0.05)', 'rgba(10,6,18,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header */}
            <FadeIn delay={0}>
              <View style={{ marginHorizontal: 16, marginVertical: 16 }}>
                <CustomText style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>
                  Hello, Welcome back
                </CustomText>
                <CustomText style={{ color: COLORS.textPrimary, fontSize: 28, fontWeight: '800' }}>
                  Discover Today
                </CustomText>
              </View>
            </FadeIn>

            {/* Featured Live Content */}
            <FadeIn delay={40}>
              <FeaturedBanner title="Sunday Morning Worship Service - Live" plays={4250} isLive={true} />
            </FadeIn>

            {/* Category Filter */}
            <FadeIn delay={80}>
              <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                >
                  {['All', 'Worship', 'Gospel', 'Contemporary', 'Prayer'].map((cat) => (
                    <TrendingPill
                      key={cat}
                      label={cat}
                      isActive={activeCategory === cat.toLowerCase()}
                      onPress={() => setActiveCategory(cat.toLowerCase())}
                    />
                  ))}
                </ScrollView>
              </View>
            </FadeIn>

            {/* Recommended For You */}
            <SmartContentRail
              title="Recommended For You"
              subtitle="Based on your listening history"
              items={dummyContent.map((item) => ({
                id: item.id,
                title: item.title,
                author: item.author,
                plays: item.plays,
                likes: item.likes,
                onPress: () => router.push(`/player/${item.id}` as any),
                onPlayPress: () => console.log('Play', item.id),
              }))}
              cardSize={railCardSize}
              horizontal={true}
              showEngagementHint={true}
            />

            {/* Trending Now */}
            <SmartContentRail
              title="Trending Now"
              subtitle="What's popular this week"
              items={[...dummyContent]
                .sort((a, b) => b.plays - a.plays)
                .map((item) => ({
                  id: item.id,
                  title: item.title,
                  author: item.author,
                  plays: item.plays,
                  likes: item.likes,
                  badge: '🔥 Trending',
                  onPress: () => router.push(`/player/${item.id}` as any),
                  onPlayPress: () => console.log('Play', item.id),
                }))}
              cardSize={railCardSize}
              horizontal={true}
            />

            {/* New Releases */}
            <SmartContentRail
              title="New Releases"
              subtitle="Fresh uploads from your favorite creators"
              items={[...dummyContent]
                .reverse()
                .map((item) => ({
                  id: item.id,
                  title: item.title,
                  author: item.author,
                  plays: item.plays,
                  likes: item.likes,
                  badge: 'NEW',
                  onPress: () => router.push(`/player/${item.id}` as any),
                  onPlayPress: () => console.log('Play', item.id),
                }))}
              cardSize="sm"
              horizontal={true}
            />

            {/* Discover Section */}
            <View style={{ marginHorizontal: 16 }}>
              <FadeIn delay={160}>
                <CustomText style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  Discover More
                </CustomText>
                <View style={{ gap: 12 }}>
                  <LinearGradient
                    colors={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <CustomText style={{ color: COLORS.success, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                        COMMUNITY
                      </CustomText>
                      <CustomText style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' }}>
                        Join Creator Communities
                      </CustomText>
                    </View>
                    <MaterialIcons name="arrow-forward" size={20} color={COLORS.success} />
                  </LinearGradient>

                  <LinearGradient
                    colors={['rgba(59,130,246,0.2)', 'rgba(59,130,246,0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <CustomText style={{ color: '#3B82F6', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                        CREATOR
                      </CustomText>
                      <CustomText style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' }}>
                        Start Your Channel
                      </CustomText>
                    </View>
                    <MaterialIcons name="arrow-forward" size={20} color="#3B82F6" />
                  </LinearGradient>
                </View>
              </FadeIn>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

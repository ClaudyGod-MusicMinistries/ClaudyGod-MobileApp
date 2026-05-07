import React, { useMemo } from 'react';
import { Image, ImageBackground, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/layout/Screen';
import { useGuestMode } from '../context/GuestModeContext';
import { CustomText } from '../components/CustomText';
import { FadeIn } from '../components/ui/FadeIn';
import { TVTouchable } from '../components/ui/TVTouchable';
import { AppButton } from '../components/ui/AppButton';
import { PremiumHero, QuickActionGrid, getFeaturedItem } from '../components/Exp/PremiumContent';
import { useContentFeed } from '../hooks/useContentFeed';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';

export default function LandingScreen() {
  const router = useRouter();
  const { enterGuestMode } = useGuestMode();
  const { width } = useWindowDimensions();
  const { feed } = useContentFeed();
  const isTablet = width >= 900;
  const isCompact = width < 390;
  const featured = useMemo(() => getFeaturedItem(feed.live, feed.music, feed.videos, feed.recent), [feed]);
  const handleGuest = () => { enterGuestMode(); router.replace(APP_ROUTES.tabs.home); };

  return (
    <View style={{ flex: 1, backgroundColor: '#08050F' }}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor="#08050F" />
      <ImageBackground source={LANDING_BG_ASSET} style={{ flex: 1 }} resizeMode="cover">
        <LinearGradient colors={['rgba(8,5,15,0.96)', 'rgba(8,5,15,0.78)', 'rgba(8,5,15,0.98)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
              <Screen style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
                <View style={{ flex: 1, paddingTop: 10, paddingBottom: 24, gap: isTablet ? 24 : 18 }}>
                  <FadeIn>
                    <View style={{ borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Image source={BRAND_LOGO_ASSET} style={{ width: 30, height: 30, borderRadius: 10 }} />
                        <View style={{ flex: 1 }}><CustomText variant="label" style={{ color: '#FFFFFF' }} numberOfLines={1}>ClaudyGod</CustomText><CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.58)' }} numberOfLines={1}>Music, worship, video, and live ministry</CustomText></View>
                      </View>
                      <TVTouchable onPress={() => router.push(APP_ROUTES.auth.signIn)} showFocusBorder={false} style={{ minHeight: 34, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}><CustomText variant="label" style={{ color: '#FFFFFF' }}>Sign in</CustomText></TVTouchable>
                    </View>
                  </FadeIn>
                  <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
                    <FadeIn delay={60}>
                      <View style={{ gap: 10, maxWidth: isTablet ? 720 : undefined }}>
                        <CustomText variant="hero" style={{ color: '#FFFFFF', fontSize: isCompact ? 32 : isTablet ? 52 : 40, lineHeight: isCompact ? 38 : isTablet ? 60 : 48, letterSpacing: -1.2 }}>Worship, music, and live moments.</CustomText>
                        <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.70)', maxWidth: 620 }}>Stream songs, watch videos, follow live sessions, and keep your favorite ministry moments close.</CustomText>
                      </View>
                    </FadeIn>
                    <View style={{ flexDirection: isTablet ? 'row' : 'column', gap: 16, alignItems: isTablet ? 'stretch' : undefined }}>
                      <View style={{ flex: isTablet ? 1.05 : undefined }}>
                        <PremiumHero item={featured} title={featured?.title ?? 'Start your worship experience'} subtitle={featured?.description ?? 'Discover music, videos, and live sessions curated for everyday worship.'} eyebrow={featured?.subtitle ?? 'Featured'} primaryLabel={featured?.type === 'video' || featured?.type === 'live' ? 'Watch now' : 'Play now'} primaryIcon={featured?.type === 'video' || featured?.type === 'live' ? 'smart-display' : 'play-arrow'} onPrimary={() => router.replace(APP_ROUTES.tabs.home)} secondaryLabel="Browse as guest" secondaryIcon="explore" onSecondary={handleGuest} height={isTablet ? 460 : isCompact ? 330 : 370} />
                      </View>
                      <FadeIn delay={120}>
                        <View style={{ flex: isTablet ? 0.72 : undefined, gap: 12 }}>
                          <AppButton title="Create account" size="lg" fullWidth onPress={() => router.push(APP_ROUTES.auth.signUp)} leftIcon={<MaterialIcons name="person-add" size={18} color="#130C22" />} />
                          <AppButton title="Continue as guest" variant="secondary" size="lg" fullWidth textColor="#FFFFFF" onPress={handleGuest} leftIcon={<MaterialIcons name="explore" size={18} color="#FFFFFF" />} style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.12)' }} />
                          <QuickActionGrid actions={[{ label: 'Music', hint: 'Songs and messages', icon: 'graphic-eq', onPress: () => router.replace(APP_ROUTES.tabs.player) }, { label: 'Videos', hint: 'Watch latest releases', icon: 'smart-display', onPress: () => router.replace(APP_ROUTES.tabs.videos) }, { label: 'Live', hint: 'Join sessions', icon: 'live-tv', onPress: () => router.replace(APP_ROUTES.tabs.live) }, { label: 'Library', hint: 'Saved moments', icon: 'library-music', onPress: () => router.replace(APP_ROUTES.tabs.library) }]} />
                        </View>
                      </FadeIn>
                    </View>
                  </View>
                </View>
              </Screen>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

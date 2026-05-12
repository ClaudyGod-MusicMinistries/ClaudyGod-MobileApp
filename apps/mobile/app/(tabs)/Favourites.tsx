import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { CustomText } from '../../components/CustomText';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { FadeIn } from '../../components/ui/FadeIn';
import { useAppTheme } from '../../util/colorScheme';
import { APP_ROUTES } from '../../util/appRoutes';
import { DEFAULT_CONTENT_IMAGE_URI } from '../../util/brandAssets';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  fetchMeLibrary,
  removeMeLibraryItem,
  type MeLibraryItem,
} from '../../services/userFlowService';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import { buildPlayerRoute } from '../../util/playerRoute';
import type { FeedCardItem } from '../../services/contentService';

function toFeedItem(item: MeLibraryItem): FeedCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle || 'ClaudyGod',
    description: item.description || '',
    duration: item.duration || '--:--',
    imageUrl: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI,
    mediaUrl: item.mediaUrl,
    type: item.type,
    createdAt: item.createdAt,
  };
}

function EmptyFavourites({ signedIn }: { signedIn: boolean }) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
      <View
        style={{
          width: 74,
          height: 74,
          borderRadius: 37,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.scheme === 'dark' ? 'rgba(183,148,246,0.14)' : 'rgba(124,58,237,0.08)',
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <MaterialIcons name="favorite-border" size={32} color={theme.colors.primary} />
      </View>

      <CustomText variant="heading" style={{ color: theme.colors.text, marginTop: 16, textAlign: 'center' }}>
        {signedIn ? 'No favourites yet' : 'Sign in to save favourites'}
      </CustomText>

      <CustomText
        variant="body"
        style={{ color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center', maxWidth: 360 }}
      >
        {signedIn
          ? 'Tap the save button on songs, videos, and live sessions to keep them here.'
          : 'Create an account or sign in to keep your favourite worship, videos, and messages synced.'}
      </CustomText>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18, justifyContent: 'center' }}>
        <AppButton
          title={signedIn ? 'Discover content' : 'Sign in'}
          size="md"
          onPress={() => router.push(signedIn ? APP_ROUTES.tabs.search : APP_ROUTES.auth.signIn)}
          leftIcon={<MaterialIcons name={signedIn ? 'search' : 'login'} size={17} color={theme.colors.textInverse} />}
        />
        <AppButton
          title="Go home"
          size="md"
          variant="secondary"
          onPress={() => router.push(APP_ROUTES.tabs.home)}
          leftIcon={<MaterialIcons name="home-filled" size={17} color={theme.colors.text} />}
        />
      </View>
    </SurfaceCard>
  );
}

export default function FavouritesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [items, setItems] = useState<FeedCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFavourites = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const library = await fetchMeLibrary();
      setItems(library.liked.map(toFeedItem));
    } catch {
      showToast({
        title: 'Favourites unavailable',
        message: 'Please check your connection and try again.',
        tone: 'warning',
      });
    }
    setLoading(false);
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    void loadFavourites();
  }, [loadFavourites]);

  const featured = items[0] ?? null;
  const gridItems = useMemo(() => items.slice(featured ? 1 : 0), [featured, items]);

  const openItem = async (item: FeedCardItem) => {
    await trackPlayEvent({
      contentId: item.id,
      contentType: item.type,
      title: item.title,
      source: 'favourites',
    });
    router.push(buildPlayerRoute(item));
  };

  const shareItem = async (item: FeedCardItem) => {
    try {
      await Share.share({
        message: `${item.title}\n${item.subtitle}${item.mediaUrl ? `\n${item.mediaUrl}` : ''}`,
      });
    } catch {
      showToast({ title: 'Share unavailable', message: 'Please try again in a moment.', tone: 'warning' });
    }
  };

  const removeItem = async (item: FeedCardItem) => {
    setRemovingId(item.id);
    try {
      await removeMeLibraryItem({ bucket: 'liked', contentId: item.id });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      showToast({ title: 'Removed from favourites', message: item.title, tone: 'info' });
    } catch {
      showToast({ title: 'Could not remove item', message: 'Please try again.', tone: 'warning' });
    }
    setRemovingId(null);
  };

  return (
    <TabScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: theme.layout.tabBarContentPadding }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadFavourites()} tintColor={theme.colors.primary} />}
      >
        <Screen>
          <View style={{ paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGapLarge }}>
            <FadeIn>
              <View style={{ gap: 8 }}>
                <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Saved by you
                </CustomText>
                <CustomText variant="hero" style={{ color: theme.colors.text }}>
                  Favourites
                </CustomText>
                <CustomText variant="body" style={{ color: theme.colors.textSecondary, maxWidth: 560 }}>
                  Your saved worship, videos, live sessions, and messages in one focused space.
                </CustomText>
              </View>
            </FadeIn>

            {!items.length && !loading ? <EmptyFavourites signedIn={isAuthenticated} /> : null}

            {featured ? (
              <FadeIn delay={70}>
                <SurfaceCard tone="strong" style={{ padding: theme.spacing.md }}>
                  <View style={{ flexDirection: isTablet ? 'row' : 'column', gap: theme.spacing.lg }}>
                    <Image
                      source={{ uri: featured.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
                      style={{ width: isTablet ? 220 : '100%', height: isTablet ? 220 : 220, borderRadius: theme.radius.xl }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
                      <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                        Continue from favourites
                      </CustomText>
                      <CustomText variant="display" style={{ color: theme.colors.text }} numberOfLines={2}>
                        {featured.title}
                      </CustomText>
                      <CustomText variant="body" style={{ color: theme.colors.textSecondary }} numberOfLines={3}>
                        {featured.description || featured.subtitle}
                      </CustomText>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                        <AppButton title="Play" onPress={() => void openItem(featured)} leftIcon={<MaterialIcons name="play-arrow" size={19} color={theme.colors.textInverse} />} />
                        <AppButton title="Share" variant="secondary" onPress={() => void shareItem(featured)} leftIcon={<MaterialIcons name="ios-share" size={17} color={theme.colors.text} />} />
                      </View>
                    </View>
                  </View>
                </SurfaceCard>
              </FadeIn>
            ) : null}

            {gridItems.length ? (
              <View style={{ gap: theme.spacing.md }}>
                <CustomText variant="heading" style={{ color: theme.colors.text }}>
                  All favourites
                </CustomText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
                  {gridItems.map((item) => (
                    <SurfaceCard
                      key={item.id}
                      tone="subtle"
                      style={{ width: isTablet ? '31.7%' : '100%', padding: theme.spacing.sm }}
                    >
                      <TVTouchable onPress={() => void openItem(item)} showFocusBorder={false}>
                        <Image
                          source={{ uri: item.imageUrl || DEFAULT_CONTENT_IMAGE_URI }}
                          style={{ width: '100%', height: 154, borderRadius: theme.radius.lg }}
                          resizeMode="cover"
                        />
                        <CustomText variant="label" style={{ color: theme.colors.text, marginTop: 10 }} numberOfLines={2}>
                          {item.title}
                        </CustomText>
                        <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
                          {[item.subtitle, item.duration].filter(Boolean).join(' · ')}
                        </CustomText>
                      </TVTouchable>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <AppButton title="Play" size="sm" onPress={() => void openItem(item)} style={{ flex: 1 }} />
                        <AppButton
                          title={removingId === item.id ? 'Removing' : 'Remove'}
                          size="sm"
                          variant="outline"
                          textColor={theme.colors.danger}
                          onPress={() => void removeItem(item)}
                          style={{ flex: 1, borderColor: theme.colors.danger }}
                        />
                      </View>
                    </SurfaceCard>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

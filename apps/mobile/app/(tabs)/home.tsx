import React, { useMemo } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FadeIn } from '../../components/ui/FadeIn';
import { SmartContentRail } from '../../components/sections/SmartContentRail';
import { CinematicHeroCard } from '../../components/sections/CinematicHeroCard';
import { BrandedHeaderCard } from '../../components/layout/BrandedHeaderCard';
import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { useContentFeed } from '../../hooks/useContentFeed';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { useAuth } from '../../context/AuthContext';
import { getHomeLayoutSections, deriveLayoutSectionItems } from '../../util/mobileLayout';
import { buildPlayerRoute, shouldOpenVideoScreen } from '../../util/playerRoute';
import { spacing } from '../../styles/designTokens';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const railCardSize = width < 900 ? 'sm' : 'md';
  const { feed } = useContentFeed();
  const { config: mobileConfig } = useMobileAppConfig();
  const { user } = useAuth();

  const spotlight =
    feed.featured ??
    feed.live[0] ??
    feed.recent[0] ??
    feed.music[0] ??
    feed.videos[0] ??
    null;

  const heroBadge = spotlight?.isLive ? 'LIVE NOW' : spotlight?.type?.toUpperCase();
  const headerSubtitle = feed.recent.length > 0 ? `${feed.recent.length} new update${feed.recent.length === 1 ? '' : 's'} ready` : undefined;
  const curatedSections = useMemo(
    () =>
      getHomeLayoutSections(mobileConfig)
        .map((section) => ({
          section,
          items: deriveLayoutSectionItems(feed, section),
        }))
        .filter((entry) => entry.items.length > 0),
    [feed, mobileConfig],
  );

  return (
    <TabScreenWrapper>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          <FadeIn delay={0}>
            <BrandedHeaderCard
              title={user?.displayName ? `Welcome back, ${user.displayName}` : 'Welcome back'}
              subtitle={headerSubtitle}
              actions={[
                {
                  icon: 'account-circle',
                  onPress: () => router.push('/settings/account'),
                  accessibilityLabel: 'Account',
                },
              ]}
            />
          </FadeIn>

          {spotlight ? (
            <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
              <CinematicHeroCard
                imageUrl={spotlight.imageUrl}
                eyebrow={spotlight.subtitle}
                title={spotlight.title}
                subtitle={spotlight.type === 'live' ? 'Live right now' : spotlight.duration}
                description={spotlight.description}
                badge={heroBadge}
                height={width < 390 ? 300 : 340}
                actions={[
                  {
                    label: shouldOpenVideoScreen(spotlight) ? 'Watch' : 'Listen',
                    onPress: () => router.push(buildPlayerRoute(spotlight)),
                    icon: shouldOpenVideoScreen(spotlight) ? 'play-circle-filled' : 'headphones',
                  },
                ]}
              />
            </View>
          ) : null}

          {curatedSections.map(({ section, items }) => (
            <SmartContentRail
              key={section.id}
              title={section.title}
              subtitle={section.subtitle}
              items={items.map((item) => ({
                id: item.id,
                title: item.title,
                author: item.subtitle,
                plays: item.liveViewerCount,
                duration: item.duration,
                imageUrl: item.imageUrl,
                badge: item.isLive ? 'LIVE' : undefined,
                onPress: () => router.push(buildPlayerRoute(item)),
              }))}
              cardSize={railCardSize}
              horizontal={true}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </TabScreenWrapper>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { TabScreenWrapper } from '../../components/layout/TabScreenWrapper';
import { Screen } from '../../components/layout/Screen';
import { CustomText } from '../../components/CustomText';
import { FadeIn } from '../../components/ui/FadeIn';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { AppButton } from '../../components/ui/AppButton';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { BrandLoader } from '../../components/branding/BrandLoader';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { buildPlayerRoute, routeParamToString } from '../../util/playerRoute';
import { trackPlayEvent } from '../../services/supabaseAnalytics';
import {
  fetchMobileSectionDetail,
  type FeedCardItem,
  type LayoutScreen,
  type MobileSectionDetail,
} from '../../services/contentService';
import { ContentList, EmptyState } from '../../components/feed';

const useStyles = makeStyles((theme) => ({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerTextWrap: { flex: 1, minWidth: 0 },
  headerTitle: { color: theme.colors.text },
  headerMeta: { color: theme.colors.textSecondary, marginTop: 2 },
  loadingWrap: { alignItems: 'center', paddingVertical: 60 },
  errorPad: { padding: theme.spacing.lg, gap: 10 },
  errorTitle: { color: theme.colors.text },
  errorBody: { color: theme.colors.textSecondary },
  outerPad: { gap: theme.spacing.lg, paddingTop: theme.layout.sectionGap },
  scrollFill: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: theme.layout.tabBarContentPadding },
}));

const VALID_SCREENS: LayoutScreen[] = ['home', 'videos', 'player', 'library'];

function isLayoutScreen(value: string | undefined): value is LayoutScreen {
  return VALID_SCREENS.includes(value as LayoutScreen);
}

export default function SectionDetailScreen() {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    sectionId?: string | string[];
    screen?: string | string[];
    title?: string | string[];
  }>();

  const sectionId = routeParamToString(params.sectionId);
  const screen: LayoutScreen = isLayoutScreen(routeParamToString(params.screen)) ? (routeParamToString(params.screen) as LayoutScreen) : 'home';
  const fallbackTitle = routeParamToString(params.title) ?? 'Section';

  const [detail, setDetail] = useState<MobileSectionDetail | null>(null);
  const [items, setItems] = useState<FeedCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (page: number) => {
    if (!sectionId) {
      setError('Section not found.');
      setLoading(false);
      return;
    }

    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const result = await fetchMobileSectionDetail(sectionId, screen, page, 20);
      setDetail(result);
      setItems((current) => (page === 1 ? result.items : [...current, ...result.items]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this section');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sectionId, screen]);

  useEffect(() => { void load(1); }, [load]);

  const openItem = async (item: FeedCardItem) => {
    await trackPlayEvent({ contentId: item.id, contentType: item.type, title: item.title, source: `section_${sectionId}` });
    router.push(buildPlayerRoute(item) as never);
  };

  const title = detail?.section.title ?? fallbackTitle;

  return (
    <TabScreenWrapper>
      <ScrollView
        style={styles.scrollFill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void load(1)}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <Screen>
          <View style={styles.outerPad}>
            <FadeIn>
              <View style={styles.headerRow}>
                <TVTouchable onPress={() => router.back()} showFocusBorder={false} style={styles.backBtn}>
                  <MaterialIcons name="arrow-back" size={20} color={theme.colors.text} />
                </TVTouchable>
                <View style={styles.headerTextWrap}>
                  <CustomText variant="label" style={styles.headerTitle} numberOfLines={1}>{title}</CustomText>
                  {detail?.section.subtitle ? (
                    <CustomText variant="caption" style={styles.headerMeta} numberOfLines={1}>{detail.section.subtitle}</CustomText>
                  ) : null}
                </View>
              </View>
            </FadeIn>

            {loading && !items.length ? (
              <View style={styles.loadingWrap}>
                <BrandLoader label="Loading section" size="md" textColor={theme.colors.text} />
              </View>
            ) : null}

            {error ? (
              <SurfaceCard tone="subtle" style={styles.errorPad}>
                <MaterialIcons name="error-outline" size={24} color={theme.colors.danger} />
                <CustomText variant="subtitle" style={styles.errorTitle}>Unable to open this section</CustomText>
                <CustomText variant="caption" style={styles.errorBody}>{error}</CustomText>
                <AppButton title="Try again" variant="secondary" onPress={() => void load(1)} />
              </SurfaceCard>
            ) : null}

            {!loading && !error && items.length > 0 ? (
              <ContentList
                title={detail?.total ? `${detail.total} item${detail.total === 1 ? '' : 's'}` : 'All content'}
                items={items}
                onPressItem={(item) => void openItem(item)}
              />
            ) : null}

            {!loading && !error && !items.length ? (
              <EmptyState
                title="Nothing here yet"
                message="Check back soon — We are sorry for the inconvenience."
              />
            ) : null}

            {detail?.hasMore ? (
              <AppButton
                title={loadingMore ? 'Loading...' : 'Load more'}
                variant="secondary"
                loading={loadingMore}
                onPress={() => void load((detail.page ?? 1) + 1)}
              />
            ) : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

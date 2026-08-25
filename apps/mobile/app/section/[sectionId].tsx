import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { trackContentPlay } from '../../services/supabaseAnalytics';
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
  paginationShell: { gap: theme.spacing.sm, paddingTop: theme.spacing.sm },
  paginationMeta: { color: theme.colors.textSecondary, textAlign: 'center' },
  paginationRow: { flexDirection: 'row', gap: theme.spacing.sm },
  paginationButton: { flex: 1 },
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
  const scrollRef = useRef<ScrollView>(null);
  const requestSequence = useRef(0);
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
  const [pendingPage, setPendingPage] = useState<number | null>(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (page: number) => {
    if (!sectionId) {
      setError('Section not found.');
      setLoading(false);
      return;
    }

    const requestId = ++requestSequence.current;
    setLoading(true);
    setPendingPage(page);
    setError(null);

    try {
      const result = await fetchMobileSectionDetail(sectionId, screen, page, 20);
      if (requestId !== requestSequence.current) return;
      setDetail(result);
      setItems(result.items);
      if (page > 1) scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (err) {
      if (requestId !== requestSequence.current) return;
      setError(err instanceof Error ? err.message : 'Unable to load this section');
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setPendingPage(null);
      }
    }
  }, [sectionId, screen]);

  useEffect(() => { void load(1); }, [load]);

  const openItem = async (item: FeedCardItem) => {
    await trackContentPlay(item, `section_${sectionId}`);
    router.push(buildPlayerRoute(item) as never);
  };

  const title = detail?.section.title ?? fallbackTitle;

  return (
    <TabScreenWrapper>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollFill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && pendingPage === 1}
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
                <AppButton title="Try again" variant="gradient" size="lg" fullWidth onPress={() => void load(1)} />
              </SurfaceCard>
            ) : null}

            {!error && items.length > 0 ? (
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

            {detail && !error && detail.total > detail.limit ? (
              <View style={styles.paginationShell}>
                <CustomText variant="caption" style={styles.paginationMeta}>
                  Page {detail.page} of {Math.ceil(detail.total / detail.limit)} · {detail.total} total items
                </CustomText>
                <View style={styles.paginationRow}>
                <AppButton
                  title="Previous"
                  variant="secondary"
                  size="lg"
                  disabled={loading || detail.page <= 1}
                  loading={pendingPage === detail.page - 1}
                  loadingLabel="Loading"
                  style={styles.paginationButton}
                  leftIcon={<MaterialIcons name="chevron-left" size={18} color={theme.colors.text} />}
                  onPress={() => void load(detail.page - 1)}
                />
                <AppButton
                  title="Next"
                  variant="primary"
                  size="lg"
                  disabled={loading || !detail.hasMore}
                  loading={pendingPage === detail.page + 1}
                  loadingLabel="Loading"
                  style={styles.paginationButton}
                  rightIcon={<MaterialIcons name="chevron-right" size={18} color={theme.colors.onPrimary} />}
                  onPress={() => void load(detail.page + 1)}
                />
                </View>
              </View>
            ) : null}
          </View>
        </Screen>
      </ScrollView>
    </TabScreenWrapper>
  );
}

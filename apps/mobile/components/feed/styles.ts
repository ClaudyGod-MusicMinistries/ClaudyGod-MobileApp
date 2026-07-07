import { makeStyles } from '../../styles/makeStyles';

// Shared style factory for every components/feed/* file — kept as one factory
// (rather than one per file) since these components were split out of a single
// PremiumContent.tsx and the visual language across them is one system.
export const useFeedStyles = makeStyles((theme) => ({
  // PremiumPage
  pageScroll:         { flex: 1, backgroundColor: 'transparent' },
  pageContent:        { paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGap },
  headerLeft:         { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  headerTitle:        { color: theme.colors.text, fontWeight: '700', letterSpacing: -0.3 },
  headerSubtitle:     { color: theme.colors.textSecondary, marginTop: 2, maxWidth: 720, fontSize: 12 },
  headerRight:        { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },

  // NavIconButton
  navIconBtn: {
    borderRadius: theme.radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFillMed,
    borderWidth: 1,
  },

  // PremiumHero
  heroContainer: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  heroBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 10,
  },
  heroBadgeDot:      { width: 6, height: 6, borderRadius: 3 },
  heroMetaText:      { color: 'rgba(255,255,255,0.52)', fontSize: 11, marginTop: 5, letterSpacing: 0.2 },
  heroSubtitle:      { color: 'rgba(255,255,255,0.76)', marginTop: 6, maxWidth: 520, lineHeight: 20 },
  heroButtons:       { flexDirection: 'row', gap: 8, marginTop: 14 },

  // QuickActionGrid
  quickCompactItem:  { alignItems: 'center', gap: 8, width: 68 },
  quickCompactCircle: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  quickCompactLabel: { color: theme.colors.text, fontSize: 11, fontWeight: '500', textAlign: 'center' },
  quickWideCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: theme.radius.card, borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.subtleFill,
  },
  quickWideLabel:    { color: theme.colors.text, fontSize: 13.5, fontWeight: '600' },
  quickWideHint:     { color: theme.colors.textMuted, marginTop: 2 },

  // ContentCard
  artworkContainer: {
    borderRadius: 10, overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
  },
  liveBadge: {
    position: 'absolute', top: 7, left: 7,
    borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.92)',
    paddingHorizontal: 7, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  liveBadgeDot:    { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF' },
  liveBadgeText:   { color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  durationPill: {
    position: 'absolute', right: 7, bottom: 7,
    borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 5, paddingVertical: 2,
  },
  durationText:    { color: '#FFFFFF', fontSize: 9, fontWeight: '500' },
  cardTextArea:    { gap: 3, paddingTop: 1 },
  cardTitleRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  cardTitle:       { color: theme.colors.text, fontSize: 13, lineHeight: 18, fontWeight: '600', flex: 1 },
  cardMoreBtn:     { paddingTop: 2 },
  cardSubtitle:    { color: theme.colors.textMuted, fontSize: 11 },

  // ContentRail
  railGap:         { gap: 12 },
  railHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  railTitleWrap:   { flex: 1, minWidth: 0 },
  railTitle:       { color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  railSubtitle:    { color: theme.colors.textMuted, marginTop: 3, fontSize: 12.5 },
  railActionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 6, paddingLeft: 12 },
  railActionText:  { color: theme.colors.primary, fontSize: 12.5, fontWeight: '600' },

  // InlineEmpty
  inlineEmpty: {
    minHeight: 96, borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  inlineEmptyIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
  },
  inlineEmptyTitle:   { color: theme.colors.text },
  inlineEmptyMessage: { color: theme.colors.textSecondary, marginTop: 3 },

  // ContentList
  listTitle:     { color: theme.colors.text, marginBottom: 12, fontWeight: '700', letterSpacing: -0.2 },
  listItemThumb: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt, flexShrink: 0,
  },
  listItemImg:    { width: '100%', height: '100%' },
  listDuration: {
    position: 'absolute', right: 5, bottom: 5, borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.76)', paddingHorizontal: 5, paddingVertical: 2,
  },
  listDurationText:  { color: '#FFFFFF', fontSize: 9 },
  listItemTitle:     { color: theme.colors.text, lineHeight: 18, fontWeight: '600' },
  listItemSubtitle:  { color: theme.colors.textSecondary, marginTop: 4 },

  // CompactContentRow
  compactRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11 },
  compactThumb: {
    width: 56, height: 56, borderRadius: 12,
    overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt, flexShrink: 0,
  },
  compactTitle:      { color: theme.colors.text, fontWeight: '600' },
  compactSubtitle:   { color: theme.colors.textSecondary, marginTop: 3 },

  // EmptyState
  emptyContainer:    { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
    marginBottom: 16,
  },
  emptyTitle:    { color: theme.colors.text, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  emptyMessage:  { color: theme.colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20, fontSize: 13, maxWidth: 300 },

  // TrendingList
  trendingHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendingTitle:    { color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  trendingActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.subtleFill,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  trendingActionText: { color: theme.colors.primary, fontSize: 11.5, fontWeight: '600' },
  trendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  trendingFirstRow:  { borderTopWidth: 0 },
  trendingArtwork: {
    width: 58, height: 58, borderRadius: 12,
    overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt, flexShrink: 0,
  },
  trendingItemTitle:    { color: theme.colors.text, fontWeight: '600' },
  trendingItemSubtitle: { color: theme.colors.textSecondary, marginTop: 3 },
  trendingPlayBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
  },

  // FeaturedSectionCard
  featuredHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingLeft: 10 },
  featuredActionText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  featuredCardShell: { borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt },
  featuredLiveBadge: {
    position: 'absolute', top: 14, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  featuredLiveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  featuredLiveText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  featuredPlayRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featuredPlayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  featuredSubText:  { color: 'rgba(255,255,255,0.55)', fontSize: 12 },

  // StreamingBanner
  streamingCard: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  streamingInner:   { flexDirection: 'row', alignItems: 'stretch' },
  streamingBadge: {
    alignSelf: 'flex-start', borderRadius: 999,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  streamingBadgeText: { color: theme.colors.primary, fontSize: 9.5, fontWeight: '700', letterSpacing: 1 },
  streamingSubtitle:  { color: theme.colors.textSecondary, lineHeight: 17 },
  streamingCtaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, backgroundColor: theme.colors.primary,
  },
  streamingCtaText: { color: theme.colors.textInverse, fontSize: 12, fontWeight: '700' },

  // GreetingBanner
  greetingRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 2 },
  greetingLeft:      { gap: 4, flex: 1, minWidth: 0 },
  greetingTitle:     { color: theme.colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6, lineHeight: 30 },
  greetingDate:      { color: theme.colors.textMuted, fontSize: 13, fontWeight: '400', lineHeight: 19 },
  greetingNotifBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill,
    borderWidth: 1, borderColor: theme.colors.border,
    flexShrink: 0, marginLeft: 12,
  },

  // ContentShortcuts
  shortcutItem:      { alignItems: 'center', gap: 8, paddingHorizontal: 2, minWidth: 70 },
  shortcutLabel:     { color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '500', textAlign: 'center' },

  // LiveNowBanner
  liveCard:          { borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface },
  liveBgImage:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.10 },
  liveIndicator: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.dangerSurface,
    borderWidth: 1, borderColor: theme.colors.dangerBorder,
  },
  liveDot:           { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.danger },
  liveLabel:         { color: theme.colors.danger, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 5 },
  liveItemTitle:     { color: theme.colors.text, fontWeight: '700' },
  liveItemSubtitle:  { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 },
  liveJoinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 999, backgroundColor: theme.colors.danger,
  },
  liveJoinText:      { color: theme.colors.onPrimary, fontSize: 12.5, fontWeight: '700' },

  // WordOfDayCard
  wordCard: {
    borderRadius: theme.radius.xl, overflow: 'hidden', borderWidth: 1,
    borderColor: theme.colors.warningBorder,
    backgroundColor: theme.colors.warningSurface,
  },
  wordAccentBar:     { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: theme.colors.warning },
  wordContent:       { padding: 18, paddingLeft: 20 },
  wordLabelRow:      { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  wordLabel:         { color: theme.colors.warning, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', fontSize: 10 },
  wordTitle:         { color: theme.colors.text, fontWeight: '700', fontSize: 16, lineHeight: 23 },
  wordBody:          { color: theme.colors.textSecondary, marginTop: 8, lineHeight: 19, fontSize: 13 },
  wordReadMore:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  wordReadMoreText:  { color: theme.colors.primary, fontWeight: '600' },

  // SectionLabel
  sectionLabelRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabelTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.4, flex: 1 },
  sectionActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingVertical: 6, paddingLeft: 12, paddingRight: 2,
  },
  sectionActionText: { color: theme.colors.primary, fontSize: 12.5, fontWeight: '600' },
  sectionSubtitle:   { color: theme.colors.textMuted, marginTop: 3, fontSize: 12.5 },
}));

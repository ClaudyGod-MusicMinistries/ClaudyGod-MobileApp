const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/* global __dirname */

const root = path.resolve(__dirname, '..');

test('every active static route has a matching Expo Router file', () => {
  const expected = [
    'app/index.tsx', 'app/(tabs)/home.tsx', 'app/(tabs)/player.tsx',
    'app/(tabs)/videos.tsx', 'app/(tabs)/live.tsx', 'app/(tabs)/search.tsx',
    'app/(tabs)/settings.tsx', 'app/(tabs)/library.tsx',
    'app/settingsPage/Privacy.tsx', 'app/settingsPage/Donate.tsx',
    'app/settingsPage/PrivacyPolicy.tsx', 'app/settingsPage/Terms.tsx',
    'app/settingsPage/Payment.tsx', 'app/settingsPage/help.tsx',
    'app/settingsPage/About.tsx', 'app/settingsPage/Rate.tsx',
    'app/settingsPage/Word.tsx', 'app/settingsPage/Referral.tsx',
    'app/live/[sessionId].tsx', 'app/section/[sectionId].tsx',
  ];
  for (const relativePath of expected) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `Missing route ${relativePath}`);
  }
});

test('giving and legal workflows are backend-authoritative', () => {
  const giving = fs.readFileSync(path.join(root, 'app/settingsPage/Donate.tsx'), 'utf8');
  const privacy = fs.readFileSync(path.join(root, 'app/settingsPage/Privacy.tsx'), 'utf8');
  const legal = fs.readFileSync(path.join(root, 'components/legal/LegalDocumentScreen.tsx'), 'utf8');
  assert.match(giving, /createPublicDonationIntent\(/);
  assert.match(giving, /A request is not a completed payment|not a completed payment/i);
  assert.doesNotMatch(giving, /All transactions are encrypted|impactBreakdown/);
  assert.match(privacy, /isAuthenticated/);
  assert.match(privacy, /APP_ROUTES\.settingsPages\.privacyPolicy/);
  assert.match(privacy, /APP_ROUTES\.settingsPages\.terms/);
  assert.doesNotMatch(privacy, /\/legal\/privacy|\/legal\/terms/);
  assert.match(legal, /fetchLegalDocument\(documentId\)/);
  assert.match(legal, /effectiveDate/);
  assert.match(legal, /version/);
});

test('giving typography and controls are theme-token driven in both schemes', () => {
  const giving = fs.readFileSync(path.join(root, 'app/settingsPage/Donate.tsx'), 'utf8');
  const typography = fs.readFileSync(path.join(root, 'components/CustomText.tsx'), 'utf8');
  assert.doesNotMatch(giving, /#[0-9a-f]{3,8}|rgba?\s*\(/i);
  assert.match(giving, /controlSelectedSurface/);
  assert.match(giving, /controlSelectedText/);
  assert.match(giving, /controlSelectedBorder/);
  assert.match(typography, /color:\s*theme\.colors\.text/);
});

test('premium product-information screens share the giving flow and guest-safe backend services', () => {
  const screens = ['app/settingsPage/Referral.tsx', 'app/settingsPage/About.tsx', 'app/settingsPage/Rate.tsx'];
  for (const screen of screens) {
    const source = fs.readFileSync(path.join(root, screen), 'utf8');
    assert.match(source, /PremiumPage/);
    assert.match(source, /variant="gradient"/);
    assert.match(source, /fullWidth/);
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}|rgba?\s*\(/i);
  }
  const legal = fs.readFileSync(path.join(root, 'components/legal/LegalDocumentScreen.tsx'), 'utf8');
  const referral = fs.readFileSync(path.join(root, 'hooks/useReferral.ts'), 'utf8');
  const flows = fs.readFileSync(path.join(root, 'services/userFlowService.ts'), 'utf8');
  const mobileApi = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/mobile/mobile.routes.ts'), 'utf8');
  const installationAuth = fs.readFileSync(path.resolve(root, '../../services/api/src/middleware/authenticateInstallation.ts'), 'utf8');
  const installationStore = fs.readFileSync(path.join(root, 'lib/installationSessionStorage.ts'), 'utf8');
  assert.match(legal, /PremiumPage/);
  assert.match(legal, /title="Try again" variant="gradient" size="lg" fullWidth/);
  assert.match(referral, /\/v1\/mobile\/referrals\/profile/);
  assert.match(referral, /\/v1\/mobile\/referrals\/share/);
  assert.match(flows, /\/v1\/mobile\/ratings/);
  assert.match(mobileApi, /guestFeedbackLimiter/);
  assert.match(mobileApi, /\/referrals\/attribute/);
  assert.match(mobileApi, /authenticateInstallation/);
  assert.match(mobileApi, /\/installations\/events/);
  assert.doesNotMatch(referral, /JSON\.stringify\(\{ deviceId \}\)/);
  assert.match(installationAuth, /resolveInstallationCredential/);
  assert.match(installationStore, /SecureStore\.WHEN_UNLOCKED_THIS_DEVICE_ONLY/);
  assert.doesNotMatch(installationStore, /AsyncStorage\.setItem/);
});

test('help support is guest-capable, trackable, backend-configured, and token driven', () => {
  const help = fs.readFileSync(path.join(root, 'app/settingsPage/help.tsx'), 'utf8');
  assert.doesNotMatch(help, /isAuthenticated|Sign in to continue|useAuth/);
  assert.match(help, /createGuestSupportRequest\(/);
  assert.match(help, /fetchGuestSupportRequestStatuses\(/);
  assert.match(help, /saveGuestSupportState\(/);
  assert.match(help, /config\?\.help\.contact/);
  assert.match(help, /config\?\.help\.faqs/);
  assert.match(help, /controlSelectedSurface/);
  assert.match(help, /response\.ticket\.id/);
  assert.doesNotMatch(help, /#[0-9a-f]{3,8}|rgba?\s*\(/i);
});

test('root navigation does not force a launch delay or replace navigation offline', () => {
  const source = fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8');
  assert.doesNotMatch(source, /2200/);
  assert.doesNotMatch(source, /return\s+<OfflineScreen/);
  assert.match(source, /OfflineBanner/);
});

test('one root authentication provider covers every navigation branch', () => {
  const rootLayout = fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8');
  assert.equal((rootLayout.match(/<AuthProvider>/g) ?? []).length, 1);
  assert.equal((rootLayout.match(/<\/AuthProvider>/g) ?? []).length, 1);
  assert.ok(rootLayout.indexOf('<AuthProvider>') < rootLayout.indexOf('<RootLayoutInner />'));
  assert.match(rootLayout, /import \{ AuthProvider \} from '\.\.\/features\/auth\/AuthContext'/);
});

test('settings route registry exposes native privacy policy and terms destinations', () => {
  const routes = fs.readFileSync(path.join(root, 'util/appRoutes.ts'), 'utf8');
  const service = fs.readFileSync(path.join(root, 'services/userFlowService.ts'), 'utf8');
  assert.match(routes, /'settings\.privacyPolicy': APP_ROUTES\.settingsPages\.privacyPolicy/);
  assert.match(routes, /'settings\.terms': APP_ROUTES\.settingsPages\.terms/);
  assert.match(service, /'settings\.privacyPolicy'/);
  assert.match(service, /'settings\.terms'/);
  const settings = fs.readFileSync(path.join(root, 'app/(tabs)/settings.tsx'), 'utf8');
  assert.match(settings, /destination: 'settings\.privacyPolicy'/);
  assert.match(settings, /destination: 'settings\.terms'/);
});

test('OAuth has one brokered identity path and stores only ClaudyGod sessions', () => {
  const authService = fs.readFileSync(path.join(root, 'services/authService.ts'), 'utf8');
  const storage = fs.readFileSync(path.join(root, 'lib/authSessionStorage.ts'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'lib/supabase.ts'), 'utf8');
  const signIn = fs.readFileSync(path.join(root, 'features/auth/sign-in.tsx'), 'utf8');
  const apiApp = fs.readFileSync(path.resolve(root, '../../services/api/src/app.ts'), 'utf8');
  const broker = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/auth/oauthBroker.routes.ts'), 'utf8');
  assert.match(authService, /maybeCompleteAuthSession\(\)/);
  assert.match(authService, /signInWithOAuth/);
  assert.match(authService, /\/v1\/auth\/oauth\/exchange/);
  assert.match(authService, /loginMobileUserWithApple/);
  assert.doesNotMatch(authService, /facebook/i);
  assert.match(storage, /SecureStore\.setItemAsync/);
  assert.match(supabaseClient, /flowType:\s*'pkce'/);
  assert.match(signIn, /fetchOAuthProviderAvailability/);
  assert.match(signIn, /oauthProviders\.apple/);
  assert.match(apiApp, /oauthBrokerRouter/);
  assert.match(broker, /authenticate/);
  assert.match(broker, /issueAuthSession/);
  assert.equal(fs.existsSync(path.resolve(root, '../../services/api/src/modules/auth/oauth.service.ts')), false);
});

test('shared entrance motion honors reduced-motion preferences', () => {
  const source = fs.readFileSync(path.join(root, 'components/ui/FadeIn.tsx'), 'utf8');
  assert.match(source, /useReducedMotion/);
  assert.match(source, /if \(reduceMotion\)/);
});

test('search shortcuts execute backend search and daily teaching exposes retryable structured guidance', () => {
  const search = fs.readFileSync(path.join(root, 'app/(tabs)/search.tsx'), 'utf8');
  const word = fs.readFileSync(path.join(root, 'app/settingsPage/Word.tsx'), 'utf8');
  const context = fs.readFileSync(path.join(root, 'context/WordOfDayContext.tsx'), 'utf8');
  const modal = fs.readFileSync(path.join(root, 'components/modals/WordOfDayModal.tsx'), 'utf8');
  const apiWord = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/wordOfDay/wordOfDay.service.ts'), 'utf8');

  assert.match(search, /fetchSearchResults\(normalized, type\)/);
  assert.match(search, /runSearch\(shortcut\.query, resolvedCategory\)/);
  assert.match(search, /runSearch\(term, 'All'\)/);
  assert.match(word, /adminWord\.teaching/);
  assert.match(word, /adminWord\.application/);
  assert.match(word, /adminWord\.prayer/);
  assert.doesNotMatch(word, /Read the passage slowly|Choose one practical response|Turn what you have learned/);
  assert.match(word, /ErrorState message=\{error\}/);
  assert.match(context, /refresh: load/);
  assert.match(modal, /useReducedMotion/);
  assert.match(modal, /title="Open guided teaching"/);
  assert.match(apiWord, /message_date <= CURRENT_DATE/);
});

test('shared buttons, typography, and recovery states enforce professional layout contracts', () => {
  const button = fs.readFileSync(path.join(root, 'components/ui/AppButton.tsx'), 'utf8');
  const text = fs.readFileSync(path.join(root, 'components/CustomText.tsx'), 'utf8');
  const page = fs.readFileSync(path.join(root, 'components/feed/PremiumPage.tsx'), 'utf8');
  const boundary = fs.readFileSync(path.join(root, 'components/ErrorBoundary.tsx'), 'utf8');
  assert.match(button, /btnStretch:\s*\{[^}]*width:\s*'100%'/);
  assert.match(button, /replayKey=\{loading \? 'loading' : 'ready'\}/);
  assert.doesNotMatch(button, /btnMd:\s*\{\s*height:/);
  assert.doesNotMatch(text, /variantLineDefaults/);
  assert.match(text, /maxFontSizeMultiplier\s*\?\?\s*1\.3/);
  assert.match(page, /styles\.pageSections/);
  assert.match(page, /compact \? theme\.layout\.sectionGap : theme\.layout\.sectionGapLarge/);
  assert.match(boundary, /title="Try again" variant="gradient" size="lg" fullWidth/);
  assert.doesNotMatch(boundary, /TouchableOpacity/);
});

test('music and video failures use premium full-width recovery while players respect reduced motion', () => {
  const music = fs.readFileSync(path.join(root, 'features/media/MusicScreen.tsx'), 'utf8');
  const videos = fs.readFileSync(path.join(root, 'app/(tabs)/videos.tsx'), 'utf8');
  const failure = fs.readFileSync(path.join(root, 'components/ui/ErrorState.tsx'), 'utf8');
  const audioPlayer = fs.readFileSync(path.join(root, 'components/media/AudioPlayer.tsx'), 'utf8');
  const videoPlayer = fs.readFileSync(path.join(root, 'components/media/VideoPlayer.tsx'), 'utf8');
  assert.match(music, /error && !allQueue\.length/);
  assert.match(videos, /error && !allQueue\.length/);
  assert.match(music, /Your worship player/);
  assert.match(videos, /Now watching/);
  assert.match(failure, /variant=\{isPage \? 'gradient' : 'secondary'\}/);
  assert.match(failure, /size=\{isPage \? 'lg' : 'md'\} fullWidth/);
  assert.match(audioPlayer, /useReducedMotion/);
  assert.match(audioPlayer, /!reduceMotion/);
  assert.match(videoPlayer, /title="Open on YouTube" variant="gradient" size="lg" fullWidth/);
});

test('modal presentation is restricted to approved design-system primitives', () => {
  const approved = new Set([
    'components/ui/BottomSheet.tsx',
    'components/ui/ConfirmModal.tsx',
    'components/modals/WordOfDayModal.tsx',
  ]);
  const sourceRoot = path.join(root, 'components');
  const visit = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return visit(absolute);
    if (!entry.name.endsWith('.tsx')) return [];
    const source = fs.readFileSync(absolute, 'utf8');
    return /<Modal\b/.test(source) ? [path.relative(root, absolute)] : [];
  });
  assert.deepEqual(new Set(visit(sourceRoot)), approved);

  const provider = fs.readFileSync(path.join(root, 'context/AppModalContext.tsx'), 'utf8');
  assert.match(provider, /<ConfirmModal/);
  assert.match(provider, /brandMark/);
});

test('library uses authenticated backend state with a guest and offline device cache', () => {
  const libraryContext = fs.readFileSync(path.join(root, 'context/LocalContentContext.tsx'), 'utf8');
  const downloadsContext = fs.readFileSync(path.join(root, 'context/DownloadsContext.tsx'), 'utf8');
  const libraryScreen = fs.readFileSync(path.join(root, 'app/(tabs)/library.tsx'), 'utf8');
  const analytics = fs.readFileSync(path.join(root, 'services/supabaseAnalytics.ts'), 'utf8');
  const mobileApi = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/mobile/mobile.routes.ts'), 'utf8');
  const installationService = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/mobile/installation.service.ts'), 'utf8');
  const migrations = fs.readFileSync(path.resolve(root, '../../services/api/src/db/migrate.ts'), 'utf8');
  assert.match(libraryContext, /getStoredMobileSession\(\)/);
  assert.match(libraryContext, /fetchMeLibrary\(\)/);
  assert.match(libraryContext, /fetchMeRecentlyPlayed\(100\)/);
  assert.match(libraryContext, /saveMeLibraryItem\(/);
  assert.match(libraryContext, /removeMeLibraryItem\(/);
  assert.match(libraryContext, /guestOnlyFavorites/);
  assert.match(libraryContext, /getFavorites\(\)/);
  assert.match(libraryContext, /addFavorite\(item\)/);
  assert.match(libraryContext, /addHistory\(item\)/);
  assert.match(downloadsContext, /getDownloads\(\)/);
  assert.match(downloadsContext, /exists: file\.exists/);
  assert.match(downloadsContext, /if \(file\.exists\) file\.delete\(\)/);
  assert.match(downloadsContext, /savedAt/);
  assert.match(libraryScreen, /function CollectionHeader/);
  assert.match(libraryScreen, /function LibraryMediaList/);
  assert.match(libraryScreen, /await deleteDownload\(item\.id\)/);
  assert.match(libraryScreen, /Device verified/);
  assert.doesNotMatch(libraryScreen, /<ContentRail/);
  assert.match(migrations, /CREATE TABLE IF NOT EXISTS mobile_installation_history/);
  assert.match(installationService, /ON CONFLICT \(installation_id, content_id\) DO UPDATE/);
  assert.match(installationService, /ORDER BY last_played_at DESC/);
  assert.match(mobileApi, /get\('\/installations\/history', authenticateInstallation/);
  assert.match(mobileApi, /delete\('\/installations\/history', authenticateInstallation/);
  assert.match(analytics, /export function trackContentPlay/);
  assert.match(libraryContext, /fetchInstallationRecentlyPlayed\(100\)/);
  assert.match(libraryScreen, /await clearInstallationPlaybackHistory\(\)/);
  // Physical file URIs are sandbox-local and must never be persisted as if
  // another device or the backend could access them.
  assert.doesNotMatch(downloadsContext, /saveMeLibraryItem|removeMeLibraryItem/);
});

test('authenticated settings require backend acknowledgement and retain a local offline cache', () => {
  const settings = fs.readFileSync(path.join(root, 'app/(tabs)/settings.tsx'), 'utf8');
  assert.match(settings, /fetchMePreferences\(\)/);
  assert.match(settings, /updateMePreferences\(/);
  assert.match(settings, /getStoredMobileSession\(\)/);
  assert.match(settings, /setPreference\(/);
});

test('settings capabilities describe and control real playback and privacy behavior', () => {
  const settings = fs.readFileSync(path.join(root, 'app/(tabs)/settings.tsx'), 'utf8');
  const music = fs.readFileSync(path.join(root, 'features/media/MusicScreen.tsx'), 'utf8');
  const audio = fs.readFileSync(path.join(root, 'components/media/AudioPlayer.tsx'), 'utf8');
  const youtube = fs.readFileSync(path.join(root, 'components/media/YouTubeAudioPlayer.tsx'), 'utf8');
  const pushService = fs.readFileSync(path.join(root, 'services/pushNotificationService.ts'), 'utf8');
  const pushHook = fs.readFileSync(path.join(root, 'hooks/usePushNotify.ts'), 'utf8');
  const mobileApi = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/mobile/mobile.routes.ts'), 'utf8');
  const pushBackend = fs.readFileSync(path.resolve(root, '../../services/api/src/infra/push.ts'), 'utf8');
  const migrations = fs.readFileSync(path.resolve(root, '../../services/api/src/db/migrate.ts'), 'utf8');
  assert.match(settings, /label: 'Audio quality'[\s\S]*statusLabel: 'Adaptive'/);
  assert.doesNotMatch(settings, /label: 'High quality audio'/);
  assert.match(settings, /label: 'Recommendations'[\s\S]*installation’s playback history/);
  assert.match(settings, /updateInstallationPersonalization/);
  assert.match(settings, /label: 'Crash diagnostics'/);
  assert.match(music, /getPreference\('autoplayEnabled'/);
  assert.match(music, /advanceOnFinish=\{autoplayEnabled/);
  assert.match(audio, /advanceOnFinish/);
  assert.match(youtube, /msg\.state === 0 && advanceOnFinish/);
  assert.match(settings, /await toggleNotifications\(value\)/);
  assert.match(settings, /await persistPreference\('notificationsEnabled', value\)/);
  assert.match(settings, /label: 'Email delivery'/);
  assert.match(pushService, /saveInstallationPushToken/);
  assert.match(pushService, /removeInstallationPushToken/);
  assert.match(pushHook, /Promise<boolean>/);
  assert.match(migrations, /CREATE TABLE IF NOT EXISTS mobile_installation_push_tokens/);
  assert.match(migrations, /CREATE TABLE IF NOT EXISTS mobile_installation_live_subscriptions/);
  assert.match(mobileApi, /post\('\/installations\/push-token', authenticateInstallation/);
  assert.match(mobileApi, /post\('\/installations\/live-subscriptions', authenticateInstallation/);
  assert.match(pushBackend, /mobile_installation_live_subscriptions/);
  assert.match(pushBackend, /mobile_installation_push_tokens/);
});

test('settings and music use distinct supported professional icons', () => {
  const icons = fs.readFileSync(path.join(root, 'components/ui/AppIcon.tsx'), 'utf8');
  const settings = fs.readFileSync(path.join(root, 'app/(tabs)/settings.tsx'), 'utf8');
  const music = fs.readFileSync(path.join(root, 'features/media/MusicScreen.tsx'), 'utf8');

  assert.match(settings, /icon: 'policy'.*Privacy Policy/);
  assert.match(settings, /icon: 'gavel'.*Terms of Service/);
  assert.match(settings, /icon: 'info-outline'.*About/);
  assert.match(settings, /icon: 'star-outline'.*Rate the app/);
  assert.match(icons, /policy: 'file-text'/);
  assert.match(icons, /gavel: 'clipboard'/);
  assert.match(icons, /'info-outline': 'info'/);
  assert.match(icons, /'star-outline': 'star'/);
  assert.match(icons, /'library-music': 'disc'/);
  assert.match(icons, /'queue-music': 'list'/);
  assert.match(icons, /'open-in-new': 'external-link'/);
  assert.match(music, /primaryIcon=\{active\?\.mediaUrl \? 'open-in-new' : 'queue-music'\}/);
});

test('section rendering never silently truncates assigned content and exposes rail overflow', () => {
  const list = fs.readFileSync(path.join(root, 'components/feed/ContentList.tsx'), 'utf8');
  const home = fs.readFileSync(path.join(root, 'app/(tabs)/home.tsx'), 'utf8');
  const music = fs.readFileSync(path.join(root, 'features/media/MusicScreen.tsx'), 'utf8');
  const videos = fs.readFileSync(path.join(root, 'app/(tabs)/videos.tsx'), 'utf8');
  const library = fs.readFileSync(path.join(root, 'app/(tabs)/library.tsx'), 'utf8');
  const mobileApi = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/mobile/mobile.service.ts'), 'utf8');
  const detail = fs.readFileSync(path.join(root, 'app/section/[sectionId].tsx'), 'utf8');
  const adminConfig = fs.readFileSync(path.resolve(root, '../../admin/web/src/views/config/MobileConfigView.vue'), 'utf8');

  assert.match(list, /\{items\.map\(\(item, index\)/);
  assert.doesNotMatch(list, /items\.slice\(0, maxItems\)/);
  for (const screen of [home, music, videos, library]) {
    assert.match(screen, /deriveLayoutSectionOverflowCount/);
    assert.match(screen, /overflowCount > 0/);
  }
  assert.match(mobileApi, /loadContentTaggedIntoSections\(sectionTokens\)/);
  assert.match(mobileApi, /overflowCount: Math\.max\(0, sectionPool\.length - section\.maxItems\)/);
  assert.match(mobileApi, /WITH section_items AS/);
  assert.match(mobileApi, /UNION ALL/);
  assert.match(mobileApi, /SELECT COUNT\(\*\)::text AS count FROM section_items/);
  assert.match(mobileApi, /ORDER BY sort_order NULLS LAST, updated_at DESC, created_at DESC, item_kind ASC, id DESC/);
  assert.match(mobileApi, /app_sections && \$3::text\[\]/);
  assert.match(mobileApi, /LIMIT \$4 OFFSET \$5/);
  assert.match(detail, /setItems\(result\.items\)/);
  assert.doesNotMatch(detail, /\.\.\.current, \.\.\.result\.items/);
  assert.match(detail, /Page \{detail\.page\} of \{Math\.ceil\(detail\.total \/ detail\.limit\)\}/);
  assert.match(adminConfig, /Verify published content/);
  assert.match(adminConfig, /published · \$\{shown\} in rail · \$\{paginated\} in See all/);
  assert.match(mobileApi, /content_section_assignments assignment/);
  assert.match(adminConfig, /MOBILE_SECTION_RAIL_MIN_ITEMS/);
});

test('bottom navigation is an opaque token-driven dock with native tab events', () => {
  const tabBar = fs.readFileSync(path.join(root, 'components/TabBar.tsx'), 'utf8');
  const colors = fs.readFileSync(path.join(root, 'constants/color.ts'), 'utf8');
  const tokens = fs.readFileSync(path.join(root, 'styles/designTokens.ts'), 'utf8');
  assert.match(tabBar, /backgroundColor: theme\.colors\.tabBarBg/);
  assert.match(tabBar, /borderTopColor: theme\.colors\.tabBarBorder/);
  assert.match(tabBar, /accessibilityRole="tab"/);
  assert.match(tabBar, /type: 'tabPress'.*canPreventDefault: true/);
  assert.match(tabBar, /type: 'tabLongPress'/);
  assert.match(tabBar, /player:\s+\{ icon: 'play-arrow', label: 'Player', center: true \}/);
  assert.match(tabBar, /item\.center\s*\?\s*<CenterPlayerTab/);
  assert.match(tabBar, /accessibilityLabel="Open player"/);
  assert.match(tabBar, /useReducedMotion/);
  assert.match(tabBar, /withTiming\(focused \? 1 : 0/);
  assert.match(tabBar, /translateX: layout\.tabBarPlayIconOpticalOffset/);
  assert.doesNotMatch(tabBar, /pointerEvents: 'box-none'/);
  assert.ok((colors.match(/tabBarTextActive:/g) ?? []).length === 2, 'Both color schemes need explicit active tab text');
  assert.ok((colors.match(/tabBarActiveSurface:/g) ?? []).length === 2, 'Both color schemes need explicit active surfaces');
  assert.ok((colors.match(/tabBarActionSurface:/g) ?? []).length === 2, 'Both color schemes need an explicit player action surface');
  assert.match(tokens, /tabBarContentPadding:\s+112/);
  assert.match(tokens, /tabBarActionLift:\s+18/);
  assert.match(tokens, /tabBarPlayIconOpticalOffset:\s+1\.5/);
  assert.doesNotMatch(tabBar, /const sharedProps = \{\s*key:/);
  assert.match(tabBar, /<CenterPlayerTab key=\{item\.key\} \{\.\.\.sharedProps\}/);
  assert.match(tabBar, /<TabItem key=\{item\.key\} \{\.\.\.sharedProps\}/);
});

test('guest recommendations use verified installation history and enforce opt-out', () => {
  const feed = fs.readFileSync(path.join(root, 'services/contentService.ts'), 'utf8');
  const analytics = fs.readFileSync(path.join(root, 'services/supabaseAnalytics.ts'), 'utf8');
  const mobileApi = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/mobile/mobile.routes.ts'), 'utf8');
  const mobileService = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/mobile/mobile.service.ts'), 'utf8');
  const installation = fs.readFileSync(path.resolve(root, '../../services/api/src/modules/mobile/installation.service.ts'), 'utf8');
  assert.match(feed, /\/v1\/mobile\/recommendations\?limit=12/);
  assert.match(analytics, /getPreference\('personalizationEnabled'/);
  assert.match(analytics, /contentId: input\.contentId/);
  assert.match(mobileApi, /getInstallationRecommendations\(req\.installation!\.id/);
  assert.match(mobileService, /installation_affinity_v1/);
  assert.match(mobileService, /affinity > 0/);
  assert.match(mobileService, /!playedIds\.has\(item\.id\)/);
  assert.match(installation, /DELETE FROM mobile_installation_events WHERE installation_id = \$1 AND content_id IS NOT NULL/);
  assert.match(installation, /mayPersonalize \? input\.contentId/);
});

test('store builds declare every sensitive native permission with purpose-specific copy', () => {
  process.env.CLAUDYGOD_ENV = 'production';
  const configPath = path.join(root, 'app.config.js');
  delete require.cache[require.resolve(configPath)];
  const config = require(configPath).expo;
  const plugins = new Map(config.plugins.filter(Array.isArray).map(([name, options]) => [name, options]));
  const picker = plugins.get('expo-image-picker');
  const audio = plugins.get('expo-audio');
  const notifications = plugins.get('expo-notifications');
  assert.match(picker.photosPermission, /select.*you choose/i);
  assert.match(picker.cameraPermission, /only when you choose/i);
  assert.match(picker.microphonePermission, /only when you choose/i);
  assert.match(audio.microphonePermission, /only when you choose/i);
  assert.equal(audio.recordAudioAndroid, true);
  assert.equal(notifications.defaultChannel, 'default');
  assert.equal(notifications.enableBackgroundRemoteNotifications, false);
});

test('production identity, updates, and privacy manifest are deterministic', () => {
  process.env.CLAUDYGOD_ENV = 'production';
  const configPath = path.join(root, 'app.config.js');
  delete require.cache[require.resolve(configPath)];
  const config = require(configPath).expo;
  assert.match(config.ios.bundleIdentifier, /^[a-zA-Z][a-zA-Z0-9.-]+$/);
  assert.equal(config.android.package, config.ios.bundleIdentifier);
  assert.match(config.updates.url, /^https:\/\/u\.expo\.dev\/[0-9a-f-]{36}$/);
  assert.deepEqual(config.runtimeVersion, { policy: 'appVersion' });
  assert.ok(config.ios.privacyManifests.NSPrivacyAccessedAPITypes.length > 0);
});

test('store listing has legal URLs and contains no unresolved placeholder copy', () => {
  const metadata = fs.readFileSync(path.join(root, 'store-listing/metadata.md'), 'utf8');
  assert.match(metadata, /https:\/\/claudygod\.org\/legal\/privacy/);
  assert.match(metadata, /https:\/\/claudygod\.org\/legal\/terms/);
  assert.doesNotMatch(metadata, /YOUR_|example\.com|TBD/i);
});

test('vendored image parser rejects zero-length ICNS and ISO BMFF boxes without hanging', () => {
  const script = `
    const path = require('node:path');
    const packageRoot = path.dirname(require.resolve('image-size/package.json'));
    const { ICNS } = require(path.join(packageRoot, 'dist/types/icns.js'));
    const { JXL } = require(path.join(packageRoot, 'dist/types/jxl.js'));
    const icns = Buffer.from([0x69,0x63,0x6e,0x73, 0,0,0,16, 0x69,0x63,0x31,0x30, 0,0,0,0]);
    const jxlp = Buffer.from([0,0,0,0, 0x6a,0x78,0x6c,0x70, 0,0,0,0]);
    try { ICNS.calculate(icns); throw new Error('ICNS payload was accepted'); }
    catch (error) { if (!/Invalid ICNS/.test(String(error))) throw error; }
    try { JXL.calculate(jxlp); throw new Error('JXL payload was accepted'); }
    catch (error) { if (!/No codestream/.test(String(error))) throw error; }
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: root,
    encoding: 'utf8',
    timeout: 1_500,
  });
  assert.equal(result.signal, null, 'image parser process exceeded its bounded execution time');
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

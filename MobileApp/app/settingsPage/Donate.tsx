/* eslint-disable @typescript-eslint/no-explicit-any */
// app/settingsPage/Donate.tsx
// Redesigned support/donate hub with streaming-app layout cues (Spotify/YouTube/Audiomack)
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../../components/CustomText';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
import { spacing, radius, shadows, tv as tvTokens } from '../../styles/designTokens';

const quickActions = [
  { icon: 'favorite', label: 'Donate', description: 'Fuel new content & outreach', color: '#1ED760' },
  { icon: 'live-tv', label: 'Go Live', description: 'Stream services instantly', color: '#22D3EE' },
  { icon: 'playlist-add', label: 'Submit Content', description: 'Upload tracks, sermons, videos', color: '#FFB020' },
  { icon: 'bug-report', label: 'Report Issue', description: 'Tell us what’s broken', color: '#FF3B30' },
];

const supportChannels = [
  {
    icon: 'chat-bubble',
    title: 'Live Chat',
    description: 'Average response < 2 min',
    action: () => console.log('Open live chat'),
  },
  {
    icon: 'email',
    title: 'Email',
    description: 'support@claudygodmusic.com',
    action: () => Linking.openURL('mailto:support@claudygodmusic.com?subject=Support'),
  },
  {
    icon: 'phone-in-talk',
    title: 'Call',
    description: '+1 (800) 252-8394',
    action: () => Linking.openURL('tel:+18002528394'),
  },
];

const resourceRails = [
  {
    title: 'Creator Playbooks',
    items: [
      { icon: 'video-library', title: 'Upload audio & video', cta: 'View guide' },
      { icon: 'analytics', title: 'Track performance', cta: 'Dashboards' },
      { icon: 'monetization-on', title: 'Monetize streams', cta: 'Learn more' },
    ],
  },
  {
    title: 'Platform Status',
    items: [
      { icon: 'cloud-done', title: 'All systems operational', cta: 'Status page' },
      { icon: 'update', title: 'Releases & changelog', cta: 'Latest' },
    ],
  },
];

const faqSections = [
  {
    id: 'account',
    title: 'Account & Billing',
    questions: [
      {
        question: 'How do I update my payment method?',
        answer: 'Go to Settings → Billing → Payment. You can add cards, switch defaults, or enable autopay.',
      },
      {
        question: 'Can I use one account on multiple devices?',
        answer: 'Yes—premium tiers allow up to 5 devices signed in at once including TV apps.',
      },
    ],
  },
  {
    id: 'uploads',
    title: 'Uploads & Delivery',
    questions: [
      {
        question: 'What formats do you support?',
        answer: 'Upload audio (MP3, AAC, FLAC) and video (MP4/H.264). Artwork should be JPG/PNG, 3000x3000.',
      },
      {
        question: 'How long until content is live?',
        answer: 'Instant for private links; 5–15 minutes for public catalog after processing & safety checks.',
      },
    ],
  },
  {
    id: 'quality',
    title: 'Playback & Quality',
    questions: [
      {
        question: 'Audio is buffering on TV',
        answer: 'Use Ethernet or 5GHz Wi‑Fi. In Settings → Playback choose “Adaptive” for TVs.',
      },
      {
        question: 'Video looks soft',
        answer: 'Check your upload bitrate (recommended 1080p @ 10–12 Mbps). TVs auto-scale to native resolution.',
      },
    ],
  },
];

const quickTips = [
  'Keep your app updated for the latest player fixes.',
  'Use Wi‑Fi/Ethernet when casting to TVs for stable playback.',
  'Enable “Download for offline” on your travel playlists.',
  'Restart the app if playback controls freeze.',
  'Clear cache monthly to free storage on TVs and phones.',
];

export default function HelpSupport() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Responsive sizing
  const getResponsiveSizes = () => {
    if (SCREEN_WIDTH < 375) {
      return { font: 14, icon: 20, heroHeight: 220, padding: 16 };
    }
    if (SCREEN_WIDTH < 414) {
      return { font: 15, icon: 22, heroHeight: 240, padding: 20 };
    }
    return { font: 16, icon: 24, heroHeight: 260, padding: 24 };
  };
  const sizes = getResponsiveSizes();

  const Card: React.FC<{
    onPress?: () => void;
    icon: any;
    title: string;
    subtitle?: string;
    accent?: string;
    focusable?: boolean;
  }> = ({ onPress, icon, title, subtitle, accent, focusable = true }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      focusable={focusable}
      hitSlop={tvTokens.hitSlop}
      style={{
        backgroundColor: currentColors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: currentColors.border,
        ...shadows.soft,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${(accent || currentColors.primary)}22`,
        }}
      >
        <MaterialIcons name={icon as any} size={sizes.icon} color={accent || currentColors.primary} />
      </View>
      <CustomText
        className="font-semibold mt-3"
        style={{ color: currentColors.text.primary, fontSize: sizes.font + 1 }}
      >
        {title}
      </CustomText>
      {subtitle && (
        <CustomText style={{ color: currentColors.text.secondary, marginTop: 4, fontSize: sizes.font - 1 }}>
          {subtitle}
        </CustomText>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Top hero */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <LinearGradient
            colors={[
              colorScheme === 'dark' ? '#0A0D14' : '#E8F9EF',
              colorScheme === 'dark' ? '#0F1625' : '#E8F4FF',
            ]}
            style={{
              margin: spacing.md,
              borderRadius: radius.lg,
              height: sizes.heroHeight,
              padding: spacing.lg,
              overflow: 'hidden',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <CustomText
                  className="font-bold"
                  style={{
                    color: currentColors.text.primary,
                    fontSize: sizes.font + 10,
                    lineHeight: sizes.font + 16,
                  }}
                >
                  Creator & Support Hub
                </CustomText>
                <CustomText
                  style={{
                    color: currentColors.text.secondary,
                    marginTop: spacing.sm,
                    fontSize: sizes.font,
                    lineHeight: sizes.font + 6,
                  }}
                >
                  Manage uploads, donations, support tickets, and live streams in one place. Optimized for mobile and TV remotes.
                </CustomText>
                <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => router.back()}
                    focusable
                    hitSlop={tvTokens.hitSlop}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.pill,
                      backgroundColor: currentColors.primary,
                    }}
                  >
                    <CustomText style={{ color: '#fff', fontWeight: '700' }}>Back</CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Linking.openURL('mailto:support@claudygodmusic.com')}
                    focusable
                    hitSlop={tvTokens.hitSlop}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: currentColors.border,
                      backgroundColor: `${currentColors.surface}AA`,
                    }}
                  >
                    <CustomText style={{ color: currentColors.text.primary, fontWeight: '600' }}>
                      Talk to us
                    </CustomText>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ alignItems: 'center', gap: spacing.sm }}>
                {[
                  { label: 'Uptime', value: '99.96%' },
                  { label: 'Avg. response', value: '<2 min' },
                  { label: 'Donors', value: '12.4k' },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={{
                      padding: spacing.sm,
                      borderRadius: radius.md,
                      backgroundColor: `${currentColors.surface}CC`,
                      marginBottom: 6,
                      minWidth: 110,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: currentColors.border,
                    }}
                  >
                    <CustomText style={{ color: currentColors.text.primary, fontWeight: '700' }}>
                      {item.value}
                    </CustomText>
                    <CustomText style={{ color: currentColors.text.secondary, fontSize: sizes.font - 2 }}>
                      {item.label}
                    </CustomText>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick actions rail */}
        <View style={{ paddingHorizontal: sizes.padding, marginTop: spacing.md }}>
          <CustomText
            className="font-bold mb-3"
            style={{ color: currentColors.text.primary, fontSize: sizes.font + 4 }}
          >
            Do more, faster
          </CustomText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: spacing.md }}
          >
            {quickActions.map((item) => (
              <Card
                key={item.label}
                icon={item.icon}
                title={item.label}
                subtitle={item.description}
                accent={item.color}
                onPress={() => console.log(item.label)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Support channels */}
        <View style={{ paddingHorizontal: sizes.padding, marginTop: spacing.lg }}>
          <CustomText
            className="font-bold mb-3"
            style={{ color: currentColors.text.primary, fontSize: sizes.font + 4 }}
          >
            Contact our team
          </CustomText>
          <View style={{ gap: spacing.sm }}>
            {supportChannels.map((channel) => (
              <TouchableOpacity
                key={channel.title}
                onPress={channel.action}
                activeOpacity={0.9}
                focusable
                hitSlop={tvTokens.hitSlop}
                style={{
                  backgroundColor: currentColors.surface,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: currentColors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  ...shadows.soft,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: `${currentColors.primary}22`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.md,
                  }}
                >
                  <MaterialIcons name={channel.icon as any} size={sizes.icon} color={currentColors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomText style={{ color: currentColors.text.primary, fontSize: sizes.font + 1, fontWeight: '600' }}>
                    {channel.title}
                  </CustomText>
                  <CustomText style={{ color: currentColors.text.secondary, marginTop: 4 }}>
                    {channel.description}
                  </CustomText>
                </View>
                <MaterialIcons name="chevron-right" size={sizes.icon} color={currentColors.text.secondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resources rails */}
        <View style={{ paddingHorizontal: sizes.padding, marginTop: spacing.lg }}>
          {resourceRails.map((rail) => (
            <View key={rail.title} style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <MaterialIcons name="play-circle-fill" size={sizes.icon} color={currentColors.primary} />
                <CustomText
                  className="font-bold ml-2"
                  style={{ color: currentColors.text.primary, fontSize: sizes.font + 2 }}
                >
                  {rail.title}
                </CustomText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {rail.items.map((item) => (
                  <Card
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    subtitle={item.cta}
                    accent={currentColors.primary}
                  />
                ))}
              </ScrollView>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View style={{ paddingHorizontal: sizes.padding, marginTop: spacing.lg }}>
          <CustomText
            className="font-bold mb-3"
            style={{ color: currentColors.text.primary, fontSize: sizes.font + 4 }}
          >
            FAQs
          </CustomText>
          {faqSections.map((section) => {
            const open = expanded === section.id;
            return (
              <View
                key={section.id}
                style={{
                  marginBottom: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: currentColors.surface,
                  borderWidth: 1,
                  borderColor: currentColors.border,
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  onPress={() => setExpanded(open ? null : section.id)}
                  activeOpacity={0.85}
                  focusable
                  hitSlop={tvTokens.hitSlop}
                  style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="expand-more" size={sizes.icon} color={currentColors.primary} />
                    <CustomText
                      className="font-semibold ml-2"
                      style={{ color: currentColors.text.primary, fontSize: sizes.font + 1 }}
                    >
                      {section.title}
                    </CustomText>
                  </View>
                  <MaterialIcons
                    name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={sizes.icon}
                    color={currentColors.text.secondary}
                  />
                </TouchableOpacity>
                {open && (
                  <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm }}>
                    {section.questions.map((faq) => (
                      <View key={faq.question} style={{ paddingVertical: 6 }}>
                        <CustomText
                          className="font-semibold"
                          style={{ color: currentColors.text.primary, fontSize: sizes.font }}
                        >
                          {faq.question}
                        </CustomText>
                        <CustomText style={{ color: currentColors.text.secondary, marginTop: 4 }}>
                          {faq.answer}
                        </CustomText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Quick tips */}
        <View style={{ paddingHorizontal: sizes.padding, marginTop: spacing.lg }}>
          <CustomText
            className="font-bold mb-3"
            style={{ color: currentColors.text.primary, fontSize: sizes.font + 2 }}
          >
            Quick tips
          </CustomText>
          <View
            style={{
              backgroundColor: currentColors.surface,
              borderRadius: radius.lg,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: currentColors.border,
            }}
          >
            {quickTips.map((tip, index) => (
              <View key={tip} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                <MaterialIcons name="lightbulb" size={sizes.icon - 2} color={currentColors.primary} />
                <CustomText style={{ color: currentColors.text.primary, marginLeft: spacing.sm, flex: 1 }}>
                  {tip}
                </CustomText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

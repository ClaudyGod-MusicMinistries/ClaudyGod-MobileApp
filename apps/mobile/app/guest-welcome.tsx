import React from 'react';
import { View, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { FadeIn } from '../components/ui/FadeIn';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/color';
import { spacing, radius } from '../styles/designTokens';

const GUEST_HIGHLIGHTS = [
  {
    icon: 'play-circle-filled',
    title: 'Instant access',
    description: 'Start streaming worship music and videos without signing up.',
  },
  {
    icon: 'favorite',
    title: 'Save favorites',
    description: 'Bookmark content for the current session and return to what you love.',
  },
  {
    icon: 'explore',
    title: 'Discover new content',
    description: 'Explore curated worship playlists, sermons, and live services quickly.',
  },
  {
    icon: 'shield',
    title: 'No account required',
    description: 'Browse privately with a clean experience, no registration needed.',
  },
];

export default function GuestWelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isCompact = width < 380;

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark.background }} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['rgba(6, 10, 26, 1)', 'rgba(15, 21, 48, 0.98)', 'rgba(18, 24, 58, 0.95)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: isCompact ? spacing.md : spacing.lg,
            paddingVertical: isTablet ? spacing.xxxl : spacing.lg,
            gap: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <FadeIn delay={120}>
            <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
              <View
                style={{
                  width: isTablet ? 84 : 72,
                  height: isTablet ? 84 : 72,
                  borderRadius: radius.xl,
                  backgroundColor: 'rgba(167, 139, 250, 0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(167, 139, 250, 0.28)',
                }}
              >
                <MaterialIcons name="account-circle" size={isTablet ? 42 : 38} color="#A78BFA" />
              </View>

              <View style={{ alignItems: 'center', gap: spacing.sm, maxWidth: 360 }}>
                <CustomText
                  variant="hero"
                  style={{
                    color: colors.dark.text,
                    textAlign: 'center',
                    fontSize: isTablet ? 34 : isCompact ? 26 : 30,
                  }}
                >
                  Guest mode, reimagined
                </CustomText>
                <CustomText
                  variant="body"
                  style={{
                    color: colors.dark.textSecondary,
                    textAlign: 'center',
                    fontSize: isTablet ? 16 : 14,
                    lineHeight: isTablet ? 24 : 21,
                  }}
                >
                  A cleaner, modern experience for browsing ministry content without signing in.
                </CustomText>
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={200}>
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                padding: spacing.lg,
                gap: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <MaterialIcons name="flash-on" size={20} color="#A78BFA" />
                <CustomText variant="title" style={{ color: colors.dark.text, fontSize: 14 }}>
                  Fast, distraction-free access
                </CustomText>
              </View>

              <CustomText
                variant="body"
                style={{ color: colors.dark.textSecondary, fontSize: 13.5, lineHeight: 20 }}
              >
                Enjoy worship music, videos, and live ministry with a simplified layout built for calm exploration.
                Later, save your library and playlists by creating an account.
              </CustomText>
            </View>
          </FadeIn>

          <View style={{ gap: spacing.sm }}>
            <FadeIn delay={260}>
              <CustomText
                variant="heading"
                style={{ color: colors.dark.text, fontSize: isTablet ? 18 : 16, marginLeft: spacing.sm }}
              >
                What guest mode includes
              </CustomText>
            </FadeIn>

            <View style={{ gap: spacing.sm }}>
              {GUEST_HIGHLIGHTS.map((item) => (
                <FeatureHighlightCard key={item.title} item={item} />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <AppButton
              title="Continue as Guest"
              size={isCompact ? 'sm' : 'md'}
              onPress={handleContinue}
              fullWidth
              style={{ borderRadius: radius.md }}
            />
            <AppButton
              title="Create an account"
              variant="secondary"
              size={isCompact ? 'sm' : 'md'}
              onPress={() => router.replace('/sign-up')}
              fullWidth
              style={{
                borderRadius: radius.md,
                borderColor: colors.dark.border,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
              }}
              textColor={colors.dark.text}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/sign-in')}
            style={{ alignItems: 'center', paddingVertical: spacing.sm }}
          >
            <CustomText
              variant="label"
              style={{ color: colors.dark.textSecondary, textDecorationLine: 'underline' }}
            >
              Already have an account? Sign in
            </CustomText>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

interface FeatureHighlightCardProps {
  item: {
    icon: string;
    title: string;
    description: string;
  };
}

function FeatureHighlightCard({ item }: FeatureHighlightCardProps) {
  return (
    <FadeIn>
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          padding: spacing.lg,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: 'rgba(167, 139, 250, 0.16)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name={item.icon as any} size={22} color="#A78BFA" />
        </View>

        <View style={{ flex: 1 }}>
          <CustomText
            variant="title"
            style={{ color: colors.dark.text, fontSize: 15, marginBottom: spacing.xs }}
          >
            {item.title}
          </CustomText>
          <CustomText
            variant="body"
            style={{ color: colors.dark.textSecondary, fontSize: 13.5, lineHeight: 20 }}
          >
            {item.description}
          </CustomText>
        </View>
      </View>
    </FadeIn>
  );
}

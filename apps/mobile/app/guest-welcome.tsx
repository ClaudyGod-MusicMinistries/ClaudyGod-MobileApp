import React from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomText } from '../components/CustomText';
import { AppButton } from '../components/ui/AppButton';
import { FadeIn } from '../components/ui/FadeIn';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/color';
import { spacing, radius } from '../styles/designTokens';

const GUEST_FEATURES = [
  {
    icon: 'music-note',
    title: 'Stream Worship Music',
    description: 'Explore our collection of inspiring worship music and sermons',
    color: '#A78BFA',
  },
  {
    icon: 'ondemand-video',
    title: 'Watch Videos',
    description: 'Access ministry videos and teachings on demand',
    color: '#60A5FA',
  },
  {
    icon: 'live-tv',
    title: 'Join Live Services',
    description: 'Participate in real-time ministry events and live streams',
    color: '#34D399',
  },
  {
    icon: 'favorite',
    title: 'Save Favorites',
    description: 'Bookmark your favorite content for quick access',
    color: '#F87171',
  },
  {
    icon: 'search',
    title: 'Discover Content',
    description: 'Search and explore our entire content library',
    color: '#FBBF24',
  },
  {
    icon: 'card-giftcard',
    title: 'Support Ministry',
    description: 'Donate to support the ministry (Optional)',
    color: '#A78BFA',
  },
];

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  color: string;
}

function FeatureItem({ icon, title, description, color }: FeatureItemProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <FadeIn>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: 'rgba(167, 139, 250, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(167, 139, 250, 0.12)',
        }}
      >
        <View
          style={{
            width: isTablet ? 48 : 44,
            height: isTablet ? 48 : 44,
            borderRadius: radius.md,
            backgroundColor: color + '22',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MaterialIcons
            name={icon as any}
            size={isTablet ? 24 : 22}
            color={color}
          />
        </View>

        <View style={{ flex: 1 }}>
          <CustomText
            variant="title"
            style={{
              color: colors.dark.text,
              marginBottom: spacing.xs,
              fontSize: isTablet ? 16 : 15,
            }}
          >
            {title}
          </CustomText>
          <CustomText
            variant="body"
            style={{
              color: colors.dark.textSecondary,
              fontSize: isTablet ? 13 : 12.5,
              lineHeight: isTablet ? 18 : 17,
            }}
          >
            {description}
          </CustomText>
        </View>
      </View>
    </FadeIn>
  );
}

export default function GuestWelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isCompakt = width < 380;

  const handleContinue = () => {
    // Skip the welcome and go to home
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark.background }} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['rgba(167, 139, 250, 0.06)', 'rgba(26, 20, 47, 0.8)', 'rgba(8, 6, 14, 0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: isCompakt ? spacing.md : spacing.lg,
            paddingVertical: isTablet ? spacing.xxxl : spacing.lg,
            gap: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <FadeIn delay={100}>
            <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
              <View
                style={{
                  width: isTablet ? 72 : 64,
                  height: isTablet ? 72 : 64,
                  borderRadius: radius.lg,
                  backgroundColor: 'rgba(167, 139, 250, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(167, 139, 250, 0.24)',
                }}
              >
                <MaterialIcons
                  name="celebration"
                  size={isTablet ? 40 : 36}
                  color="#A78BFA"
                />
              </View>

              <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <CustomText
                  variant="hero"
                  style={{
                    color: colors.dark.text,
                    textAlign: 'center',
                    fontSize: isTablet ? 32 : isCompakt ? 24 : 28,
                  }}
                >
                  Welcome to ClaudyGod
                </CustomText>

                <CustomText
                  variant="body"
                  style={{
                    color: colors.dark.textSecondary,
                    textAlign: 'center',
                    fontSize: isTablet ? 15 : 13.5,
                    lineHeight: isTablet ? 22 : 20,
                    maxWidth: 280,
                  }}
                >
                  Explore worship music, videos, and ministry teachings all in one place
                </CustomText>
              </View>
            </View>
          </FadeIn>

          {/* Features Grid */}
          <View style={{ gap: spacing.md }}>
            <FadeIn delay={200}>
              <CustomText
                variant="heading"
                style={{
                  color: colors.dark.text,
                  fontSize: isTablet ? 18 : 16,
                  marginLeft: spacing.sm,
                }}
              >
                What You Can Do
              </CustomText>
            </FadeIn>

            <View style={{ gap: spacing.sm }}>
              {GUEST_FEATURES.map((feature) => (
                <View key={feature.title}>
                  <FeatureItem {...feature} />
                </View>
              ))}
            </View>
          </View>

          {/* Benefits Section */}
          <View
            style={{
              backgroundColor: 'rgba(167, 139, 250, 0.06)',
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: 'rgba(167, 139, 250, 0.12)',
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <MaterialIcons name="info" size={20} color="#A78BFA" />
              <CustomText
                variant="title"
                style={{
                  color: colors.dark.text,
                  flex: 1,
                  fontSize: 14,
                }}
              >
                Guest Access
              </CustomText>
            </View>

            <CustomText
              variant="body"
              style={{
                color: colors.dark.textSecondary,
                fontSize: 13,
                lineHeight: 19,
              }}
            >
              Browse as a guest with full access to our entire content library. You can save favorites and watch content offline without creating an account.
            </CustomText>

            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <BulletPoint text="No account needed" />
              <BulletPoint text="Full library access" />
              <BulletPoint text="Save favorites locally" />
              <BulletPoint text="No data collection" />
            </View>
          </View>

          {/* Sign In Prompt */}
          <View
            style={{
              backgroundColor: 'rgba(96, 165, 250, 0.06)',
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: 'rgba(96, 165, 250, 0.12)',
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <CustomText
              variant="body"
              style={{
                color: colors.dark.text,
                fontSize: 13.5,
                lineHeight: 19,
              }}
            >
              Want synchronized access across your devices? Create a free account to sync your library, playlists, and preferences.
            </CustomText>

            <AppButton
              title="Create Account"
              onPress={() => router.replace('/sign-up')}
              size={isCompakt ? 'sm' : 'md'}
              style={{ borderRadius: radius.md }}
            />
          </View>

          {/* CTA Button */}
          <AppButton
            title="Start Exploring"
            onPress={handleContinue}
            size={isCompakt ? 'sm' : 'md'}
            fullWidth
            style={{
              borderRadius: radius.md,
              backgroundColor: colors.dark.accent,
              marginBottom: spacing.lg,
            }}
          />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

interface BulletPointProps {
  text: string;
}

function BulletPoint({ text }: BulletPointProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: '#A78BFA',
        }}
      />
      <CustomText
        variant="body"
        style={{
          color: colors.dark.textSecondary,
          fontSize: 12.5,
          flex: 1,
        }}
      >
        {text}
      </CustomText>
    </View>
  );
}

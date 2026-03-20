import React from 'react';
import { View, Linking, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';

const featureChips = [
  { icon: 'library-music', label: 'Worship releases' },
  { icon: 'smart-display', label: 'Video replays' },
  { icon: 'menu-book', label: 'Daily word' },
  { icon: 'cast', label: 'TV + web ready' },
  { icon: 'lock', label: 'Secure access' },
  { icon: 'support-agent', label: 'Support desk' },
];

const team = [
  { name: 'Claudy God', role: 'Founder & Lead Artist', desc: 'Vision, music direction, and weekly drops.' },
  { name: 'Product Crew', role: 'Experience', desc: 'Design systems, research, and accessibility.' },
  { name: 'Engineering', role: 'Platform', desc: 'Streaming quality, playback reliability, and APIs.' },
];

const social = [
  { icon: 'public', label: 'Website', url: 'https://claudygod.org' },
  { icon: 'smart-display', label: 'YouTube', url: 'https://www.youtube.com/@ClaudyGODMinistries' },
  { icon: 'forum', label: 'WhatsApp', url: 'https://wa.me/18002528394' },
  { icon: 'alternate-email', label: 'Support', url: 'mailto:support@claudygod.org' },
];

export default function About() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const { config } = useMobileAppConfig();
  const isCompact = width < 360;
  const statWidth = isCompact ? '100%' : '31%';
  const chipWidth = isCompact ? '100%' : '48%';
  const aboutConfig = config?.about;
  const heroStats = aboutConfig?.heroStats ?? [
    { label: 'Platforms', value: 'Mobile + Web' },
    { label: 'Support desk', value: 'Human-led' },
    { label: 'Content flow', value: 'Daily' },
  ];
  const featureChipItems = aboutConfig?.featureChips ?? featureChips;
  const teamMembers = aboutConfig?.team ?? team;
  const socialLinks = aboutConfig?.social ?? social;
  const versionLabel = aboutConfig?.versionLabel ?? 'Version 1.0.0';

  return (
    <SettingsScaffold
      title="About ClaudyGod"
      subtitle="The team, mission, and product standards behind the experience."
      hero={
        <FadeIn>
          <LinearGradient
            colors={[theme.colors.gradient.primary[0], theme.colors.gradient.primary[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: theme.radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              ...theme.shadows.card,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                borderRadius: theme.radius.pill,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: 'rgba(255,255,255,0.14)',
                marginBottom: spacing.sm,
              }}
            >
              <CustomText variant="label" style={{ color: '#FFFFFF' }}>
                Enterprise-grade streaming
              </CustomText>
            </View>
            <CustomText variant="heading" style={{ color: '#FFFFFF' }}>
              Built for worshipers. Crafted for creators.
            </CustomText>
            <CustomText variant="body" style={{ color: '#E5E7EB', marginTop: 6 }}>
              ClaudyGod brings worship, ministry updates, and secure account access to every screen with clarity and calm.
            </CustomText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, justifyContent: 'space-between' }}>
              {heroStats.map((item) => (
                <View
                  key={item.label}
                  style={{
                    width: statWidth,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.25)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    padding: spacing.sm,
                    marginBottom: spacing.sm,
                  }}
                >
                  <CustomText variant="subtitle" style={{ color: '#FFFFFF' }}>
                    {item.value}
                  </CustomText>
                  <CustomText variant="caption" style={{ color: '#E5E7EB', marginTop: 2 }}>
                    {item.label}
                  </CustomText>
                </View>
              ))}
            </View>
          </LinearGradient>
        </FadeIn>
      }
    >
      <FadeIn delay={80}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          {featureChipItems.map((chip) => (
            <SurfaceCard
              key={chip.label}
              tone="subtle"
              style={{
                width: chipWidth,
                padding: spacing.sm,
                marginBottom: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: `${theme.colors.primary}1E`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}
              >
                <MaterialIcons name={chip.icon as any} size={16} color={theme.colors.primary} />
              </View>
              <CustomText variant="label" style={{ color: theme.colors.text.primary, flex: 1 }}>
                {chip.label}
              </CustomText>
            </SurfaceCard>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={140}>
        <SurfaceCard style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            Our mission
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.text.secondary, marginTop: 8 }}>
            Build a focused ministry experience where worship, messages, and daily truth stay easy to discover and simple to use.
          </CustomText>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={200}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
          Team
        </CustomText>
        <View style={{ marginBottom: spacing.lg }}>
          {teamMembers.map((member) => (
            <SurfaceCard key={member.name} style={{ padding: spacing.md, marginBottom: spacing.sm }}>
              <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
                {member.name}
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.primary, marginTop: 2 }}>
                {member.role}
              </CustomText>
              <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>
                {member.desc}
              </CustomText>
            </SurfaceCard>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={260}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
          Connect
        </CustomText>
        <View>
          {socialLinks.map((item) => (
            <TVTouchable
              key={item.label}
              onPress={() => Linking.openURL(item.url)}
              style={{
                marginBottom: spacing.sm,
              }}
              showFocusBorder={false}
            >
              <SurfaceCard tone="subtle" style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: `${theme.colors.primary}1E`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}
                >
                  <MaterialIcons name={item.icon as any} size={18} color={theme.colors.primary} />
                </View>
                <CustomText variant="body" style={{ color: theme.colors.text.primary, flex: 1 }}>
                  {item.label}
                </CustomText>
                <MaterialIcons name="open-in-new" size={18} color={theme.colors.text.secondary} />
              </SurfaceCard>
            </TVTouchable>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={320}>
        <SurfaceCard tone="subtle" style={{ padding: spacing.md, marginBottom: spacing.xl }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            {versionLabel}
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
            Platforms: Android, iOS, Apple TV, Google TV, and Web.
          </CustomText>
        </SurfaceCard>
      </FadeIn>
    </SettingsScaffold>
  );
}

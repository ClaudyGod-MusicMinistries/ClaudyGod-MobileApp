import React from 'react';
import { View, TouchableOpacity, Linking, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing } from '../../styles/designTokens';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';

const featureChips = [
  { icon: 'library-music', label: 'Massive catalog' },
  { icon: 'cloud-download', label: 'Offline ready' },
  { icon: 'equalizer', label: 'Adaptive streaming' },
  { icon: 'cast', label: 'TV + Cast support' },
  { icon: 'lock', label: 'Privacy-first' },
  { icon: 'groups', label: 'Community playlists' },
];

const team = [
  { name: 'Claudy God', role: 'Founder & Lead Artist', desc: 'Vision, music direction, and weekly drops.' },
  { name: 'Product Crew', role: 'Experience', desc: 'Design systems, research, and accessibility.' },
  { name: 'Engineering', role: 'Platform', desc: 'Streaming quality, playback reliability, and APIs.' },
];

const social = [
  { icon: 'smart-display', label: 'YouTube', url: 'https://youtube.com/claudygodmusic' },
  { icon: 'photo-camera', label: 'Instagram', url: 'https://instagram.com/claudygodmusic' },
  { icon: 'facebook', label: 'Facebook', url: 'https://facebook.com/claudygodmusic' },
  { icon: 'alternate-email', label: 'Newsletter', url: 'mailto:hello@claudygodmusic.com' },
];

export default function About() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const statWidth = isCompact ? '100%' : '31%';
  const chipWidth = isCompact ? '100%' : '48%';

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
              ClaudyGod brings premium audio and video to mobile, web, and TV with stability and speed.
            </CustomText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, justifyContent: 'space-between' }}>
              {[
                { label: 'Monthly listeners', value: '3.2M' },
                { label: 'Countries', value: '48' },
                { label: 'Avg uptime', value: '99.96%' },
              ].map((item) => (
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
          {featureChips.map((chip) => (
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
            Empower every believer and creator with a streaming product that is fast, accessible, and trusted on every screen.
          </CustomText>
        </SurfaceCard>
      </FadeIn>

      <FadeIn delay={200}>
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
          Team
        </CustomText>
        <View style={{ marginBottom: spacing.lg }}>
          {team.map((member) => (
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
          {social.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => Linking.openURL(item.url)}
              style={{
                marginBottom: spacing.sm,
              }}
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
            </TouchableOpacity>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={320}>
        <SurfaceCard tone="subtle" style={{ padding: spacing.md, marginBottom: spacing.xl }}>
          <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
            Version 1.0.0
          </CustomText>
          <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
            Platforms: Android, iOS, Apple TV, Google TV, and Web.
          </CustomText>
        </SurfaceCard>
      </FadeIn>
    </SettingsScaffold>
  );
}

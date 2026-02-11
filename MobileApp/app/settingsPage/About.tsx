// app/settingsPage/About.tsx
// Clean, Spotify/YouTube-inspired about page using shared scaffold + tokens
import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { spacing, radius, shadows } from '../../styles/designTokens';

const featureChips = [
  { icon: 'library-music', label: 'Massive catalog' },
  { icon: 'cloud-download', label: 'Offline ready' },
  { icon: 'equalizer', label: 'Adaptive streaming' },
  { icon: 'cast', label: 'TV & Cast' },
  { icon: 'lock', label: 'Privacy-first' },
  { icon: 'groups', label: 'Community playlists' },
];

const team = [
  { name: 'Claudy God', role: 'Founder & Lead Artist', desc: 'Vision, music direction, and weekly drops.' },
  { name: 'Product Crew', role: 'Experience', desc: 'Design, user research, and accessibility.' },
  { name: 'Engineering', role: 'Playback & APIs', desc: 'Streaming, downloads, and multi-device sync.' },
];

const social = [
  { icon: 'smart-display', label: 'YouTube', url: 'https://youtube.com/claudygodmusic' },
  { icon: 'photo-camera', label: 'Instagram', url: 'https://instagram.com/claudygodmusic' },
  { icon: 'facebook', label: 'Facebook', url: 'https://facebook.com/claudygodmusic' },
  { icon: 'alternate-email', label: 'Newsletter', url: 'mailto:hello@claudygodmusic.com' },
];

export default function About() {
  const theme = useAppTheme();

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...shadows.soft,
      }}
    >
      <CustomText variant="heading" style={{ color: theme.colors.text.primary }}>{value}</CustomText>
      <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>{label}</CustomText>
    </View>
  );

  return (
    <SettingsScaffold
      title="About ClaudyGod"
      subtitle="The story, team, and promise behind the music."
      hero={
        <LinearGradient
          colors={[theme.colors.gradient.primary[0], theme.colors.gradient.primary[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            ...shadows.card,
          }}
        >
          <CustomText variant="heading" style={{ color: '#FFFFFF', marginBottom: spacing.sm }}>
            Built for worshipers, crafted for creators.
          </CustomText>
          <CustomText variant="body" style={{ color: '#E5E7EB' }}>
            ClaudyGod is a modern streaming home for sermons, worship, and inspirational audio/video that plays beautifully on phones, cars, and TVs.
          </CustomText>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <Stat label="Monthly listeners" value="3.2M" />
            <Stat label="Countries" value="48" />
            <Stat label="Avg uptime" value="99.96%" />
          </View>
        </LinearGradient>
      }
    >
      {/* Feature chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        {featureChips.map((chip) => (
          <View
            key={chip.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: `${theme.colors.primary}20`,
              borderWidth: 1,
              borderColor: `${theme.colors.primary}50`,
              gap: spacing.xs,
            }}
          >
            <MaterialIcons name={chip.icon as any} size={18} color={theme.colors.primary} />
            <CustomText variant="label" style={{ color: theme.colors.text.primary }}>{chip.label}</CustomText>
          </View>
        ))}
      </View>

      {/* Mission card */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: spacing.lg,
          ...shadows.soft,
        }}
      >
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
          Our mission
        </CustomText>
        <CustomText variant="body" style={{ color: theme.colors.text.secondary }}>
          Empower every believer and creator with a stage that is fast, beautiful, and safe—whether they’re streaming to a phone, casting to a TV, or downloading for the road.
        </CustomText>
      </View>

      {/* Team */}
      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
        Team
      </CustomText>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {team.map((member) => (
          <View
            key={member.name}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...shadows.soft,
            }}
          >
            <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>
              {member.name}
            </CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.primary, marginTop: 2 }}>{member.role}</CustomText>
            <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 6 }}>{member.desc}</CustomText>
          </View>
        ))}
      </View>

      {/* Social links */}
      <CustomText variant="subtitle" style={{ color: theme.colors.text.primary, marginBottom: spacing.sm }}>
        Connect
      </CustomText>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {social.map((item) => (
          <View
            key={item.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <MaterialIcons name={item.icon as any} size={20} color={theme.colors.primary} />
            <CustomText variant="body" style={{ color: theme.colors.text.primary, marginLeft: spacing.sm, flex: 1 }}>
              {item.label}
            </CustomText>
            <MaterialIcons name="open-in-new" size={18} color={theme.colors.text.secondary} />
          </View>
        ))}
      </View>

      {/* Version */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: spacing.xl,
        }}
      >
        <CustomText variant="subtitle" style={{ color: theme.colors.text.primary }}>Version 1.0.0</CustomText>
        <CustomText variant="caption" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
          Multiplatform: Android, iOS, Roku, Fire TV, Apple TV, Web.
        </CustomText>
      </View>
    </SettingsScaffold>
  );
}

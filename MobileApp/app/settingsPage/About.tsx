// app/settingsPage/About.tsx
// Clean, Spotify/YouTube-inspired about page using shared scaffold + tokens
import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsScaffold } from './Scaffold';
import { CustomText } from '../../components/CustomText';
import { useColorScheme } from '../../util/colorScheme';
import { colors } from '../../constants/color';
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
  const scheme = useColorScheme();
  const palette = colors[scheme];

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
        ...shadows.soft,
      }}
    >
      <CustomText style={{ color: palette.text.primary, fontWeight: '800', fontSize: 20 }}>{value}</CustomText>
      <CustomText style={{ color: palette.text.secondary, marginTop: 4 }}>{label}</CustomText>
    </View>
  );

  return (
    <SettingsScaffold
      title="About ClaudyGod"
      subtitle="The story, team, and promise behind the music."
      hero={
        <LinearGradient
          colors={[palette.gradient.primary[0], palette.gradient.primary[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            ...shadows.card,
          }}
        >
          <CustomText
            className="font-bold"
            style={{ color: '#FFFFFF', fontSize: 26, marginBottom: spacing.sm }}
          >
            Built for worshipers, crafted for creators.
          </CustomText>
          <CustomText style={{ color: '#E5E7EB', lineHeight: 22 }}>
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
              backgroundColor: `${palette.primary}20`,
              borderWidth: 1,
              borderColor: `${palette.primary}50`,
              gap: spacing.xs,
            }}
          >
            <MaterialIcons name={chip.icon as any} size={18} color={palette.primary} />
            <CustomText style={{ color: palette.text.primary, fontSize: 14 }}>{chip.label}</CustomText>
          </View>
        ))}
      </View>

      {/* Mission card */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: palette.border,
          marginBottom: spacing.lg,
          ...shadows.soft,
        }}
      >
        <CustomText className="font-bold" style={{ color: palette.text.primary, fontSize: 18, marginBottom: spacing.sm }}>
          Our mission
        </CustomText>
        <CustomText style={{ color: palette.text.secondary, lineHeight: 22 }}>
          Empower every believer and creator with a stage that is fast, beautiful, and safe—whether they’re streaming to a phone, casting to a TV, or downloading for the road.
        </CustomText>
      </View>

      {/* Team */}
      <CustomText className="font-bold" style={{ color: palette.text.primary, fontSize: 18, marginBottom: spacing.sm }}>
        Team
      </CustomText>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {team.map((member) => (
          <View
            key={member.name}
            style={{
              backgroundColor: palette.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: palette.border,
              ...shadows.soft,
            }}
          >
            <CustomText style={{ color: palette.text.primary, fontWeight: '700', fontSize: 16 }}>
              {member.name}
            </CustomText>
            <CustomText style={{ color: palette.primary, marginTop: 2 }}>{member.role}</CustomText>
            <CustomText style={{ color: palette.text.secondary, marginTop: 6 }}>{member.desc}</CustomText>
          </View>
        ))}
      </View>

      {/* Social links */}
      <CustomText className="font-bold" style={{ color: palette.text.primary, fontSize: 18, marginBottom: spacing.sm }}>
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
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <MaterialIcons name={item.icon as any} size={20} color={palette.primary} />
            <CustomText style={{ color: palette.text.primary, marginLeft: spacing.sm, flex: 1 }}>
              {item.label}
            </CustomText>
            <MaterialIcons name="open-in-new" size={18} color={palette.text.secondary} />
          </View>
        ))}
      </View>

      {/* Version */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: palette.border,
          marginBottom: spacing.xl,
        }}
      >
        <CustomText style={{ color: palette.text.primary, fontWeight: '700' }}>Version 1.0.0</CustomText>
        <CustomText style={{ color: palette.text.secondary, marginTop: 4 }}>
          Multiplatform: Android, iOS, Roku, Fire TV, Apple TV, Web.
        </CustomText>
      </View>
    </SettingsScaffold>
  );
}

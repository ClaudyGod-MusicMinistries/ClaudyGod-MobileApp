import React, { useMemo } from 'react';
import { Linking, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AppButton } from '../../components/ui/AppButton';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import { useRouter } from 'expo-router';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  heroPad:       { padding: theme.spacing.xl, marginBottom: theme.spacing.lg },
  heroMaxW:      { maxWidth: 720 },
  heroEyebrow:   { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 },
  heroDisplay:   { color: theme.colors.text, marginTop: 8 },
  heroBody:      { color: theme.colors.textSecondary, marginTop: 10 },
  statsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: theme.spacing.lg },
  statCard:      { borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: theme.spacing.md },
  statValue:     { color: theme.colors.text },
  statLabel:     { color: theme.colors.textSecondary, marginTop: 2 },

  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipCard:      { padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chipIconBox:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}1A` },
  chipLabel:     { color: theme.colors.text, flex: 1 },

  focusPad:      { padding: theme.spacing.lg },
  focusHeading:  { color: theme.colors.text },
  focusBody:     { color: theme.colors.textSecondary, marginTop: 8 },
  focusBtnRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },

  teamGap:       { gap: theme.spacing.sm },
  teamHeading:   { color: theme.colors.text },
  memberPad:     { padding: theme.spacing.md },
  memberName:    { color: theme.colors.text },
  memberRole:    { color: theme.colors.primary, marginTop: 3 },
  memberDesc:    { color: theme.colors.textSecondary, marginTop: 6 },

  socialGap:     { gap: theme.spacing.sm },
  socialHeading: { color: theme.colors.text },
  socialCard:    { padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}1A` },
  socialLabel:   { color: theme.colors.text, flex: 1 },

  versionPad:    { padding: theme.spacing.md },
  versionText:   { color: theme.colors.textSecondary },
}));

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function About() {
  const styles   = useStyles();
  const theme    = useAppTheme();
  const router   = useRouter();
  const { width } = useWindowDimensions();
  const { config } = useMobileAppConfig();
  const isTablet  = width >= 768;
  const isCompact = width < 390;
  const aboutConfig = config?.about;

  const stats       = useMemo(() => aboutConfig?.heroStats ?? [], [aboutConfig]);
  const chips       = useMemo(() => aboutConfig?.featureChips ?? [], [aboutConfig]);
  const team        = useMemo(() => aboutConfig?.team ?? [], [aboutConfig]);
  const socials     = useMemo(() => aboutConfig?.social ?? [], [aboutConfig]);
  const versionLabel = aboutConfig?.versionLabel ?? '';

  return (
    <SettingsScaffold
      title="About ClaudyGod"
      subtitle="The mission, experience, and ways to connect."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={styles.heroPad}>
            <View style={styles.heroMaxW}>
              <CustomText variant="caption" style={styles.heroEyebrow}>
                Ministry experience
              </CustomText>
              <CustomText variant="display" style={styles.heroDisplay}>
                Worship, teaching, and live moments made simple.
              </CustomText>
              <CustomText variant="body" style={styles.heroBody}>
                ClaudyGod brings music, video, live broadcasts, saved content, and support into one clear experience across mobile, web, tablet, and TV.
              </CustomText>
            </View>

            {stats.length ? (
              <View style={styles.statsRow}>
                {stats.map((item) => (
                  <View
                    key={item.label}
                    style={[styles.statCard, { width: isCompact ? '100%' : isTablet ? '31.7%' : '47%' }]}
                  >
                    <CustomText variant="heading" style={styles.statValue}>
                      {item.value}
                    </CustomText>
                    <CustomText variant="caption" style={styles.statLabel}>
                      {item.label}
                    </CustomText>
                  </View>
                ))}
              </View>
            ) : null}
          </SurfaceCard>
        </FadeIn>
      }
    >
      {chips.length ? (
        <FadeIn delay={70}>
          <View style={styles.chipsRow}>
            {chips.map((chip) => (
              <SurfaceCard
                key={chip.label}
                tone="subtle"
                style={[styles.chipCard, { width: isCompact ? '100%' : '47%' }]}
              >
                <View style={styles.chipIconBox}>
                  <MaterialIcons name={chip.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={17} color={theme.colors.primary} />
                </View>
                <CustomText variant="label" style={styles.chipLabel}>
                  {chip.label}
                </CustomText>
              </SurfaceCard>
            ))}
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={110}>
        <SurfaceCard tone="subtle" style={styles.focusPad}>
          <CustomText variant="heading" style={styles.focusHeading}>
            Our focus
          </CustomText>
          <CustomText variant="body" style={styles.focusBody}>
            Make worship and ministry content easy to discover, easy to play, and easy to return to whenever users need it.
          </CustomText>
          <View style={styles.focusBtnRow}>
            <AppButton title="Explore music" onPress={() => router.push(APP_ROUTES.tabs.player)} />
            <AppButton title="Watch videos" variant="secondary" onPress={() => router.push(APP_ROUTES.tabs.videos)} />
          </View>
        </SurfaceCard>
      </FadeIn>

      {team.length ? (
        <FadeIn delay={150}>
          <View style={styles.teamGap}>
            <CustomText variant="heading" style={styles.teamHeading}>
              Team
            </CustomText>
            {team.map((member) => (
              <SurfaceCard key={member.name} tone="subtle" style={styles.memberPad}>
                <CustomText variant="label" style={styles.memberName}>
                  {member.name}
                </CustomText>
                <CustomText variant="caption" style={styles.memberRole}>
                  {member.role}
                </CustomText>
                <CustomText variant="caption" style={styles.memberDesc}>
                  {member.desc}
                </CustomText>
              </SurfaceCard>
            ))}
          </View>
        </FadeIn>
      ) : null}

      {socials.length ? (
        <FadeIn delay={190}>
          <View style={styles.socialGap}>
            <CustomText variant="heading" style={styles.socialHeading}>
              Connect
            </CustomText>
            {socials.map((item) => (
              <TVTouchable key={item.label} onPress={() => void Linking.openURL(item.url)} showFocusBorder={false}>
                <SurfaceCard tone="subtle" style={styles.socialCard}>
                  <View style={styles.socialIconBox}>
                    <MaterialIcons name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={18} color={theme.colors.primary} />
                  </View>
                  <CustomText variant="label" style={styles.socialLabel}>
                    {item.label}
                  </CustomText>
                  <MaterialIcons name="open-in-new" size={18} color={theme.colors.textSecondary} />
                </SurfaceCard>
              </TVTouchable>
            ))}
          </View>
        </FadeIn>
      ) : null}

      {versionLabel ? (
        <FadeIn delay={230}>
          <SurfaceCard tone="subtle" style={styles.versionPad}>
            <CustomText variant="caption" style={styles.versionText}>
              {versionLabel}
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      ) : null}
    </SettingsScaffold>
  );
}

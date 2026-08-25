import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { PremiumPage } from '../../components/feed';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AppButton } from '../../components/ui/AppButton';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import { useRouter } from 'expo-router';
import { openExternalUrl } from '../../util/externalLinks';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  intro: { padding: theme.spacing.xl, gap: 10 },
  eyebrow: { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  introBody: { color: theme.colors.textSecondary, lineHeight: 22 },
  statsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: theme.spacing.lg },
  statCard:      { borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.primaryBorder, backgroundColor: theme.colors.primarySurface, padding: theme.spacing.md },
  statValue:     { color: theme.colors.text },
  statLabel:     { color: theme.colors.textSecondary, marginTop: 2 },

  card:          { padding: theme.spacing.lg, gap: 14 },
  sectionTitle:  { color: theme.colors.text },
  sectionBody:   { color: theme.colors.textSecondary, lineHeight: 20 },
  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipCard:      { padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chipIconBox:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySurface },
  chipLabel:     { color: theme.colors.text, flex: 1 },

  focusPad:      { padding: theme.spacing.lg },
  focusHeading:  { color: theme.colors.text },
  focusBody:     { color: theme.colors.textSecondary, marginTop: 8 },
  focusBtnRow:   { gap: 10, marginTop: 4 },

  teamGap:       { gap: theme.spacing.sm },
  teamHeading:   { color: theme.colors.text },
  memberPad:     { padding: theme.spacing.md },
  memberName:    { color: theme.colors.text },
  memberRole:    { color: theme.colors.primary, marginTop: 3 },
  memberDesc:    { color: theme.colors.textSecondary, marginTop: 6 },

  socialGap:     { gap: theme.spacing.sm },
  socialHeading: { color: theme.colors.text },
  socialCard:    { padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialIconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySurface },
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
    <PremiumPage title="About ClaudyGod" eyebrow="Our ministry" subtitle="The mission, experience, and ways to connect">
          <SurfaceCard tone="strong" style={styles.intro}>
            <CustomText variant="caption" style={styles.eyebrow}>Purpose-led digital worship</CustomText>
            <CustomText variant="display">Worship, teaching, and live moments made simple.</CustomText>
            <CustomText variant="body" style={styles.introBody}>ClaudyGod brings music, video, live broadcasts, saved content, and support into one thoughtful experience across mobile, web, tablet, and TV.</CustomText>
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
      {chips.length ? (
        <SurfaceCard tone="subtle" style={styles.card}>
          <CustomText variant="heading" style={styles.sectionTitle}>1. The experience</CustomText>
          <CustomText variant="body" style={styles.sectionBody}>Designed around the ways people worship, watch, read, and stay connected.</CustomText>
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
        </SurfaceCard>
      ) : null}

        <SurfaceCard tone="subtle" style={[styles.focusPad, styles.card]}>
          <CustomText variant="heading" style={styles.sectionTitle}>2. Our focus</CustomText>
          <CustomText variant="body" style={styles.focusBody}>
            Make worship and ministry content easy to discover, easy to play, and easy to return to whenever users need it.
          </CustomText>
          <View style={styles.focusBtnRow}>
            <AppButton title="Explore music" variant="gradient" size="lg" fullWidth onPress={() => router.push(APP_ROUTES.tabs.player)} />
            <AppButton title="Watch videos" variant="secondary" size="lg" fullWidth onPress={() => router.push(APP_ROUTES.tabs.videos)} />
          </View>
        </SurfaceCard>

      {team.length ? (
          <SurfaceCard tone="subtle" style={styles.card}>
            <CustomText variant="heading" style={styles.sectionTitle}>3. People behind the mission</CustomText>
            {team.map((member) => (
              <View key={member.name} style={styles.memberPad}>
                <CustomText variant="label" style={styles.memberName}>
                  {member.name}
                </CustomText>
                <CustomText variant="caption" style={styles.memberRole}>
                  {member.role}
                </CustomText>
                <CustomText variant="caption" style={styles.memberDesc}>
                  {member.desc}
                </CustomText>
              </View>
            ))}
          </SurfaceCard>
      ) : null}

      {socials.length ? (
          <SurfaceCard tone="strong" style={styles.card}>
            <CustomText variant="heading" style={styles.sectionTitle}>4. Connect with ClaudyGod</CustomText>
            <CustomText variant="body" style={styles.sectionBody}>Open an official channel below.</CustomText>
            {socials.map((item) => (
              <TVTouchable key={item.label} onPress={() => void openExternalUrl(item.url)} showFocusBorder={false}>
                <View style={styles.socialCard}>
                  <View style={styles.socialIconBox}>
                    <MaterialIcons name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={18} color={theme.colors.primary} />
                  </View>
                  <CustomText variant="label" style={styles.socialLabel}>
                    {item.label}
                  </CustomText>
                  <MaterialIcons name="open-in-new" size={18} color={theme.colors.textSecondary} />
                </View>
              </TVTouchable>
            ))}
          </SurfaceCard>
      ) : null}

      {versionLabel ? (
          <SurfaceCard tone="subtle" style={styles.versionPad}>
            <CustomText variant="caption" style={styles.versionText}>
              {versionLabel}
            </CustomText>
          </SurfaceCard>
      ) : null}
    </PremiumPage>
  );
}

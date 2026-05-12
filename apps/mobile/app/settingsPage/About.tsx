import React, { useMemo } from 'react';
import { Linking, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { SettingsScaffold } from '../../components/layout/SettingsScaffold';
import { CustomText } from '../../components/CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { FadeIn } from '../../components/ui/FadeIn';
import { TVTouchable } from '../../components/ui/TVTouchable';
import { AppButton } from '../../components/ui/AppButton';
import { useMobileAppConfig } from '../../hooks/useMobileAppConfig';
import { APP_ROUTES } from '../../util/appRoutes';
import { useRouter } from 'expo-router';

export default function About() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { config } = useMobileAppConfig();
  const isTablet = width >= 768;
  const isCompact = width < 390;
  const aboutConfig = config?.about;

  const stats = useMemo(() => aboutConfig?.heroStats ?? [], [aboutConfig]);
  const chips = useMemo(() => aboutConfig?.featureChips ?? [], [aboutConfig]);
  const team = useMemo(() => aboutConfig?.team ?? [], [aboutConfig]);
  const socials = useMemo(() => aboutConfig?.social ?? [], [aboutConfig]);
  const versionLabel = aboutConfig?.versionLabel ?? '';

  return (
    <SettingsScaffold
      title="About ClaudyGod"
      subtitle="The mission, experience, and ways to connect."
      hero={
        <FadeIn>
          <SurfaceCard tone="strong" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
            <View style={{ maxWidth: 720 }}>
              <CustomText variant="caption" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                Ministry experience
              </CustomText>
              <CustomText variant="display" style={{ color: theme.colors.text, marginTop: 8 }}>
                Worship, teaching, and live moments made simple.
              </CustomText>
              <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 10 }}>
                ClaudyGod brings music, video, live broadcasts, saved content, and support into one clear experience across mobile, web, tablet, and TV.
              </CustomText>
            </View>

            {stats.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: theme.spacing.lg }}>
                {stats.map((item) => (
                  <View
                    key={item.label}
                    style={{
                      width: isCompact ? '100%' : isTablet ? '31.7%' : '47%',
                      borderRadius: theme.radius.lg,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      padding: theme.spacing.md,
                    }}
                  >
                    <CustomText variant="heading" style={{ color: theme.colors.text }}>
                      {item.value}
                    </CustomText>
                    <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {chips.map((chip) => (
              <SurfaceCard key={chip.label} tone="subtle" style={{ width: isCompact ? '100%' : '47%', padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}1A` }}>
                  <MaterialIcons name={chip.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={17} color={theme.colors.primary} />
                </View>
                <CustomText variant="label" style={{ color: theme.colors.text, flex: 1 }}>
                  {chip.label}
                </CustomText>
              </SurfaceCard>
            ))}
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={110}>
        <SurfaceCard tone="subtle" style={{ padding: theme.spacing.lg }}>
          <CustomText variant="heading" style={{ color: theme.colors.text }}>
            Our focus
          </CustomText>
          <CustomText variant="body" style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            Make worship and ministry content easy to discover, easy to play, and easy to return to whenever users need it.
          </CustomText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            <AppButton title="Explore music" onPress={() => router.push(APP_ROUTES.tabs.player)} />
            <AppButton title="Watch videos" variant="secondary" onPress={() => router.push(APP_ROUTES.tabs.videos)} />
          </View>
        </SurfaceCard>
      </FadeIn>

      {team.length ? (
        <FadeIn delay={150}>
          <View style={{ gap: theme.spacing.sm }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Team
            </CustomText>
            {team.map((member) => (
              <SurfaceCard key={member.name} tone="subtle" style={{ padding: theme.spacing.md }}>
                <CustomText variant="label" style={{ color: theme.colors.text }}>
                  {member.name}
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.primary, marginTop: 3 }}>
                  {member.role}
                </CustomText>
                <CustomText variant="caption" style={{ color: theme.colors.textSecondary, marginTop: 6 }}>
                  {member.desc}
                </CustomText>
              </SurfaceCard>
            ))}
          </View>
        </FadeIn>
      ) : null}

      {socials.length ? (
        <FadeIn delay={190}>
          <View style={{ gap: theme.spacing.sm }}>
            <CustomText variant="heading" style={{ color: theme.colors.text }}>
              Connect
            </CustomText>
            {socials.map((item) => (
              <TVTouchable key={item.label} onPress={() => void Linking.openURL(item.url)} showFocusBorder={false}>
                <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.primary}1A` }}>
                    <MaterialIcons name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={18} color={theme.colors.primary} />
                  </View>
                  <CustomText variant="label" style={{ color: theme.colors.text, flex: 1 }}>
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
          <SurfaceCard tone="subtle" style={{ padding: theme.spacing.md }}>
            <CustomText variant="caption" style={{ color: theme.colors.textSecondary }}>
              {versionLabel}
            </CustomText>
          </SurfaceCard>
        </FadeIn>
      ) : null}
    </SettingsScaffold>
  );
}

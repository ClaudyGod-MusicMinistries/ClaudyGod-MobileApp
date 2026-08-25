import React from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
import { Screen } from './Screen';
import { SurfaceCard } from '../ui/SurfaceCard';
import { CustomText } from '../CustomText';
import { TVTouchable } from '../ui/TVTouchable';
import { AppScreenFooter } from './AppScreenFooter';
import { APP_ROUTES } from '../../util/appRoutes';

interface SettingsScaffoldProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  children: React.ReactNode;
  hero?: React.ReactNode;
  backRoute?: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  root:          { flex: 1, backgroundColor: theme.colors.background },
  safeArea:      { flex: 1, backgroundColor: theme.colors.background },
  scroll:        { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 124 },
  innerPad:      { paddingTop: theme.layout.headerVerticalPadding, gap: theme.layout.sectionGap },
  cardPad:       { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.md },
  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: theme.radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFillMed,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  headerFill:   { flex: 1, minWidth: 0 },
  eyebrow:      { color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.72 },
  titleText:    { color: theme.colors.text, marginTop: 2 },
  subtitleText: { color: theme.colors.textSecondary, marginTop: 2 },
  heroWrap:     { marginTop: -2 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsScaffold({ title, subtitle, icon, children, hero, backRoute = APP_ROUTES.tabs.home }: SettingsScaffoldProps) {
  const styles = useStyles();
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar
        translucent={false}
        barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={styles.scrollContent}
        >
          <Screen>
            <View style={styles.innerPad}>
              <SurfaceCard tone="strong" style={styles.cardPad}>
                <View style={styles.headerRow}>
                  <TVTouchable
                    onPress={() => router.replace(backRoute as never)}
                    showFocusBorder={false}
                    style={styles.backBtn}
                    accessibilityLabel="Go back"
                  >
                    <MaterialIcons name="chevron-left" size={23} color={theme.colors.text} />
                  </TVTouchable>

                  {icon ? (
                    <View style={styles.headerIconBox}>
                      <MaterialIcons name={icon} size={19} color={theme.colors.primary} />
                    </View>
                  ) : null}

                  <View style={styles.headerFill}>
                    <CustomText variant="caption" style={styles.eyebrow} numberOfLines={1}>
                      ClaudyGod
                    </CustomText>
                    <CustomText variant="heading" style={styles.titleText} numberOfLines={1}>
                      {title}
                    </CustomText>
                    {subtitle ? (
                      <CustomText variant="caption" style={styles.subtitleText} numberOfLines={2}>
                        {subtitle}
                      </CustomText>
                    ) : null}
                  </View>
                </View>
              </SurfaceCard>

              {hero ? <View style={styles.heroWrap}>{hero}</View> : null}
              {children}
              <AppScreenFooter />
            </View>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

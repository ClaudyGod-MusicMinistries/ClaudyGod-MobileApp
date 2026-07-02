import React from 'react';
import { Image, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomText } from '../CustomText';
import { Screen } from '../layout/Screen';
import { FadeIn } from '../ui/FadeIn';
import { TVTouchable } from '../ui/TVTouchable';
import { AuthBrandPanel } from './AuthBrandPanel';
import { BRAND_LOGO_ASSET } from '../../util/brandAssets';
import { useDeviceClass } from '../../util/deviceClassConfig';
import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  root:              { flex: 1, backgroundColor: theme.colors.background },
  flex1:             { flex: 1 },
  backBtnWrap:       { paddingHorizontal: 20, paddingTop: 8 },
  logoCenterWrap:    { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  logoImg:           { width: 64, height: 64 },
  phoneAppName: {
    color: theme.colors.textMuted, fontSize: 10.5,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginTop: 10, fontWeight: '600',
  },
  phoneTitle: {
    color: theme.colors.text, fontSize: 26, fontWeight: '700',
    letterSpacing: -0.6, lineHeight: 33, marginTop: 22, textAlign: 'center',
  },
  phoneSubtitle: {
    color: theme.colors.textMuted, marginTop: 8,
    lineHeight: 21, fontSize: 13.5, fontWeight: '400', textAlign: 'center',
  },
  phoneChildrenWrap: { marginTop: 28 },
  brandPanelFill:    { flex: 1, minWidth: 0 },
  desktopSubtitle:     { color: theme.colors.textMuted, marginTop: 8, maxWidth: 460, fontSize: 14, fontWeight: '400' },
  desktopChildrenWrap: { marginTop: 22 },
  backBtn: {
    backgroundColor: theme.colors.surface,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  phoneScrollContent: {
    flexGrow: 1, justifyContent: 'center' as const,
    paddingHorizontal: 24, paddingVertical: 28,
    width: '100%' as const, alignSelf: 'center' as const,
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

interface AuthScreenFrameProps {
  backPath: string;
  salutation: string;
  description: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthScreenFrame({ backPath, salutation, description, title, subtitle, children }: AuthScreenFrameProps) {
  const styles = useStyles();
  const router = useRouter();
  const theme  = useAppTheme();
  const device = useDeviceClass();
  const { width: screenWidth } = useWindowDimensions();
  const isPhone       = device.isPhone;
  const showBrandPanel = device.prefersTwoPane;
  const shellWidth = device.isTV ? 1380 : device.isLargeDesktop ? 1220 : device.isDesktop ? 1140 : device.isTablet ? 760 : 500;
  const formWidth  = device.isTV ? 560 : device.isDesktop ? 520 : shellWidth;

  const BackButton = (
    <TVTouchable
      onPress={() => router.replace(backPath)}
      style={[
        styles.backBtn,
        {
          width: device.isTV ? 52 : 40, height: device.isTV ? 52 : 40,
          borderRadius: device.isTV ? 26 : 20,
        },
      ]}
      showFocusBorder={false}
    >
      <MaterialIcons name="arrow-back" size={device.isTV ? 24 : 20} color={theme.colors.text} />
    </TVTouchable>
  );

  // ── Phone: centered logo, centered title/subtitle ──────────────────────────
  if (isPhone) {
    const maxFormWidth = Math.min(screenWidth, 400);

    return (
      <View style={styles.root}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <SafeAreaView style={styles.flex1} edges={['top', 'bottom']}>
          <View style={styles.backBtnWrap}>{BackButton}</View>
          <ScrollView
            style={styles.flex1}
            contentContainerStyle={[styles.phoneScrollContent, { maxWidth: maxFormWidth }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <FadeIn delay={60} duration={300}>
              <View style={styles.logoCenterWrap}>
                <View style={styles.logoBox}>
                  <Image source={BRAND_LOGO_ASSET} resizeMode="cover" style={styles.logoImg} />
                </View>
                <CustomText variant="caption" style={styles.phoneAppName}>ClaudyGod</CustomText>
                <CustomText variant="display" style={styles.phoneTitle}>{title}</CustomText>
                <CustomText variant="body" style={styles.phoneSubtitle}>{subtitle}</CustomText>
              </View>
              <View style={styles.phoneChildrenWrap}>{children}</View>
            </FadeIn>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Tablet / Desktop / TV: two-pane or centered card ──────────────────────
  return (
    <View style={styles.root}>
      <StatusBar translucent={false} backgroundColor={theme.colors.background} barStyle="light-content" />
      <SafeAreaView style={styles.flex1} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={{
            flexGrow: 1, justifyContent: 'center',
            paddingVertical: device.isTV ? 34 : 24,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Screen style={styles.flex1} contentStyle={{ flex: 1, justifyContent: 'center', maxWidth: shellWidth }}>
            <FadeIn>
              <View>
                {BackButton}
                <View
                  style={{
                    marginTop: showBrandPanel ? 24 : 16,
                    width: '100%', maxWidth: shellWidth, alignSelf: 'center',
                    flexDirection: showBrandPanel ? 'row' : 'column',
                    alignItems: showBrandPanel ? 'stretch' : 'center',
                    gap: showBrandPanel ? 28 : 18,
                  }}
                >
                  {showBrandPanel ? (
                    <View style={styles.brandPanelFill}>
                      <AuthBrandPanel salutation={salutation} description={description} />
                    </View>
                  ) : null}

                  <View
                    style={{
                      width: '100%', maxWidth: formWidth,
                      flex: showBrandPanel ? 0.82 : undefined,
                      borderRadius: device.isTablet ? 24 : 28,
                      backgroundColor: theme.colors.elevated,
                      paddingHorizontal: device.isTV ? 32 : 26,
                      paddingVertical: device.isTV ? 32 : 26,
                    }}
                  >
                    {!showBrandPanel ? (
                      <AuthBrandPanel salutation={salutation} description={description} compact />
                    ) : null}

                    <CustomText
                      variant="display"
                      style={{
                        color: theme.colors.text, marginTop: 4,
                        fontSize: device.isTV ? 28 : device.isDesktop ? 24 : 22,
                        lineHeight: device.isTV ? 34 : device.isDesktop ? 30 : 28,
                        fontWeight: '700', letterSpacing: -0.4,
                      }}
                    >
                      {title}
                    </CustomText>

                    <CustomText
                      variant="body"
                      style={[styles.desktopSubtitle, { lineHeight: device.isTV ? 22 : 20 }]}
                    >
                      {subtitle}
                    </CustomText>

                    <View style={styles.desktopChildrenWrap}>{children}</View>
                  </View>
                </View>
              </View>
            </FadeIn>
          </Screen>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

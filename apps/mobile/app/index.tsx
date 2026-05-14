import React from 'react';
import { Image, ImageBackground, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { APP_ROUTES } from '../util/appRoutes';
import { BRAND_LOGO_ASSET, LANDING_BG_ASSET } from '../util/brandAssets';
import { useAppTheme } from '../util/colorScheme';

export default function LandingScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <ImageBackground source={LANDING_BG_ASSET} resizeMode="cover" style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: 18,
          paddingBottom: 28,
          paddingTop: 56,
          backgroundColor: theme.scheme === 'dark' ? 'rgba(2,1,8,0.68)' : 'rgba(5,8,15,0.52)',
        }}
      >
        <View style={{ gap: 18 }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.22)',
            }}
          >
            <Image source={BRAND_LOGO_ASSET} style={{ width: 38, height: 38, borderRadius: 19 }} />
          </View>

          <View style={{ gap: 8 }}>
            <CustomText variant="display" style={{ color: '#FFFFFF', fontSize: 34, lineHeight: 40 }}>
              Music, videos, and live worship in one place.
            </CustomText>
            <CustomText variant="body" style={{ color: 'rgba(255,255,255,0.76)', lineHeight: 21, maxWidth: 420 }}>
              Browse public releases as a guest, or sign in to keep your library, history, alerts, and profile synced.
            </CustomText>
          </View>

          <SurfaceCard tone="strong" style={{ padding: 14, gap: 10, backgroundColor: 'rgba(10,9,18,0.86)' }}>
            <AppButton
              title="Continue as guest"
              size="lg"
              fullWidth
              onPress={() => router.replace(APP_ROUTES.tabs.home)}
              leftIcon={<MaterialIcons name="person-outline" size={18} color={theme.colors.textInverse} />}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AppButton
                title="Sign in"
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => router.push(APP_ROUTES.auth.signIn)}
                leftIcon={<MaterialIcons name="login" size={18} color={theme.colors.text} />}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Create account"
                variant="secondary"
                size="lg"
                fullWidth
                onPress={() => router.push(APP_ROUTES.auth.signUp)}
                leftIcon={<MaterialIcons name="person-add-alt" size={18} color={theme.colors.text} />}
                style={{ flex: 1 }}
              />
            </View>
            <CustomText variant="caption" style={{ color: 'rgba(255,255,255,0.58)', textAlign: 'center', lineHeight: 17 }}>
              Guest mode is limited to public listening and viewing. Personal features require an account.
            </CustomText>
          </SurfaceCard>
        </View>
      </View>
    </ImageBackground>
  );
}

import React from 'react';
import { Image, StatusBar, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton } from '../components/ui/AppButton';
import { CustomText } from '../components/CustomText';
import { Screen } from '../components/layout/Screen';
import { useAppTheme } from '../util/colorScheme';

export default function Landing() {
  const router = useRouter();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const headlineSize = width < 380 ? 32 : 36;

  return (
    <View style={{ flex: 1, backgroundColor: '#06040D' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#140C2A', '#08060F', '#06040D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={['rgba(154,107,255,0.42)', 'rgba(154,107,255,0)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{
          position: 'absolute',
          top: -40,
          left: -40,
          width: 320,
          height: 320,
          borderRadius: 320,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: -90,
          top: 210,
          width: 260,
          height: 260,
          borderRadius: 260,
          backgroundColor: 'rgba(86,42,171,0.28)',
        }}
      />

      <Screen>
        <View
          style={{
            flex: 1,
            justifyContent: 'space-between',
            paddingTop: 80,
            paddingBottom: 34,
          }}
        >
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <View
              style={{
                width: 168,
                height: 168,
                borderRadius: 84,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.24)',
                shadowColor: '#9A6BFF',
                shadowOpacity: 0.45,
                shadowRadius: 28,
                shadowOffset: { width: 0, height: 18 },
                elevation: 16,
              }}
            >
              <Image
                source={require('../assets/images/ClaudyGoLogo.webp')}
                style={{ width: 126, height: 126, borderRadius: 34 }}
              />
            </View>

            <CustomText
              variant="hero"
              style={{
                marginTop: 34,
                color: '#F8F7FC',
                textAlign: 'center',
                fontSize: headlineSize,
                lineHeight: headlineSize + 6,
                fontFamily: 'ClashDisplay_700Bold',
                fontWeight: '700',
              }}
            >
              Worship. Word. Growth.
            </CustomText>
            <CustomText
              variant="body"
              style={{
                marginTop: 12,
                color: 'rgba(205,199,228,0.84)',
                textAlign: 'center',
                lineHeight: 22,
                maxWidth: 340,
              }}
            >
              A focused welcome experience for ClaudyGod Music and every daily stream in your
              journey.
            </CustomText>
          </View>

          <View>
            <AppButton
              title="Continue with Email"
              size="lg"
              fullWidth
              onPress={() => router.push('/sign-in')}
              rightIcon={<MaterialIcons name="arrow-forward" size={18} color={theme.colors.text.inverse} />}
              style={{
                borderRadius: 18,
                shadowColor: '#9A6BFF',
                shadowOpacity: 0.55,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 14 },
                elevation: 14,
              }}
            />

            <AppButton
              title="Continue as Guest"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={() => router.replace('/(tabs)/home')}
              leftIcon={<MaterialIcons name="headphones" size={18} color="#E9DDFF" />}
              textColor="#E9DDFF"
              style={{
                marginTop: 12,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: 'rgba(233,221,255,0.32)',
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            />

            <CustomText
              variant="caption"
              style={{
                marginTop: 12,
                textAlign: 'center',
                color: 'rgba(177,170,201,0.74)',
              }}
            >
              By continuing, you agree to the terms and privacy policy.
            </CustomText>
          </View>
        </View>
      </Screen>
    </View>
  );
}

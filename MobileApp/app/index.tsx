/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useEffect } from 'react';
import { View, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText'; 
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';


const WelcomePage = () => {
    const ringPadding = useSharedValue(0);
    const ringPadding2 = useSharedValue(0);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const currentColors = colors[colorScheme];

    useEffect(() => {
        ringPadding.value = 0;
        ringPadding2.value = 0;
        
        // Use fixed pixel values
        setTimeout(() => ringPadding.value = withSpring(30), 100);
        setTimeout(() => ringPadding2.value = withSpring(20), 300);
        
        setTimeout(() => {
            router.replace('/home');
        }, 2500);
    }, []);

    const outerRingStyle = useAnimatedStyle(() => ({
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 1000,
        padding: ringPadding.value,
        marginBottom: 60,
    }));

    const innerRingStyle = useAnimatedStyle(() => ({
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 1000,
        padding: ringPadding2.value,
    }));

    return (
        <View style={{ flex: 1 }}>
            <Image 
                source={require("../assets/images/manBack.webp")}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                }}
            />
            
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                }}
            />
            
            <View 
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                }}
            >
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                
                <Animated.View style={outerRingStyle}>
                    <Animated.View style={innerRingStyle}>
                        <Image 
                            source={require("../assets/images/ClaudyGoLogo.webp")}
                            style={{ 
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                            }}
                            resizeMode="cover" 
                        />
                    </Animated.View>
                </Animated.View>
                
                <View 
                    style={{
                        alignItems: 'center',
                        marginBottom: 60,
                        gap: 16,
                    }}
                >
                    <CustomText 
                        variant="heading"
                        style={{
                            textAlign: 'center',
                            color: currentColors.text.primary,
                        }}
                    >
                        Music App
                    </CustomText>
                    <CustomText 
                        variant="body"
                        style={{
                            textAlign: 'center',
                            color: currentColors.text.secondary,
                            lineHeight: 22,
                            paddingHorizontal: 16,
                        }}
                    >
                        Discover and listen to your favorite music anytime, anywhere
                    </CustomText>
                </View>
            </View>
        </View>
    );
}

export default WelcomePage;
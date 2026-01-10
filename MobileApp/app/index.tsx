/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useEffect } from 'react';
import { View, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useSharedValue, 
    withSpring, 
    useAnimatedStyle,
    withTiming 
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CustomText } from '../components/CustomText'; 

const WelcomePage = () => {
    const ringScale = useSharedValue(1);
    const ringOpacity = useSharedValue(0);
    const router = useRouter();

    useEffect(() => {
        ringScale.value = 1;
        ringOpacity.value = 0;
        
        // First ring animation
        ringScale.value = withSpring(2.5, {
            damping: 15,
            stiffness: 100,
        });
        ringOpacity.value = withTiming(0.3, { duration: 800 });
        
        setTimeout(() => {
            router.replace('/home');
        }, 2500);
    }, []);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: ringOpacity.value,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 1000,
        padding: 40,
        position: 'absolute',
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
                
                {/* Static Logo */}
                <View style={{ marginBottom: 60 }}>
                    <Image 
                        source={require("../assets/images/ClaudyGoLogo.webp")}
                        style={{ 
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            zIndex: 10,
                        }}
                        resizeMode="cover" 
                    />
                    
                    {/* Animated Ring */}
                    <Animated.View style={ringStyle} />
                </View>
                
                <View 
                    style={{
                        alignItems: 'center',
                        gap: 16,
                    }}
                >
                    <CustomText 
                        variant="heading"
                        style={{
                            textAlign: 'center',
                            color: '#FFFFFF',
                            fontSize: 32,
                            fontWeight: 'bold',
                        }}
                    >
                        Music App
                    </CustomText>
                    <CustomText 
                        variant="body"
                        style={{
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.8)',
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
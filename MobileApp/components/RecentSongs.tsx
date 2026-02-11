import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Container } from './Container';
import { CustomText } from './CustomText';
import { SongList } from './musicPlaylist';
import { recentSongs } from '../data/data';
import { CustomButton } from './CustomButton';
import { useColorScheme } from '../util/colorScheme';
import { colors } from '../constants/color';

import Icon from 'react-native-vector-icons/Feather';

const AnimatedContainer = Animated.createAnimatedComponent(Container);

export function RecentSongsSection() {
  const colorScheme = useColorScheme();
  const currentColors = colors[colorScheme];
  
  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.9);
  const containerTranslateY = useSharedValue(20);
  const borderGlow = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animation
    containerOpacity.value = withDelay(300, withSpring(1, { damping: 15 }));
    containerScale.value = withDelay(300, withSpring(1, { damping: 15 }));
    containerTranslateY.value = withDelay(300, withSpring(0, { damping: 15 }));
    
    // Pulsing border glow effect
    borderGlow.value = withSequence(
      withDelay(1000, withSpring(1, { damping: 2 })),
      withDelay(2000, withSpring(0, { damping: 2 }))
    );
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [
      { scale: containerScale.value },
      { translateY: containerTranslateY.value }
    ]
  }));

  const borderAnimatedStyle = useAnimatedStyle(() => ({}));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [
      { translateX: interpolate(containerOpacity.value, [0, 1], [-50, 0]) }
    ]
  }));

  return (
    <AnimatedContainer 
      className="mb-6 mx-4"
      style={[
        {
          backgroundColor: '#000000',
          borderRadius: 12,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        },
        containerAnimatedStyle,
        borderAnimatedStyle
      ]}
    >
      {/* Subtle background gradient overlay */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          backgroundColor: 'rgba(107, 33, 168, 0.03)',
          borderRadius: 20,
        }}
      />
      
      {/* Header with animation */}
      <Animated.View 
        style={headerAnimatedStyle}
        className="flex-row justify-between items-center mb-6"
      >
        <View className="flex-row items-center">
          <View 
            style={{
              width: 4,
              height: 24,
              backgroundColor: currentColors.primary,
              borderRadius: 2,
              marginRight: 12,
            }}
          />
          <CustomText 
            variant="heading" 
            style={{ 
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: '700',
            }}
          >
            Recent Songs
          </CustomText>
        </View>
        
        <CustomButton
          variant="text"
          size="sm"
          onPress={() => console.log('View all songs')}
          className="bg-white/5 rounded-lg px-3 py-2"
        >
          <View className="flex-row items-center">
            <CustomText 
              variant="body" 
              style={{ 
                color: currentColors.primary,
                fontSize: 14,
                fontWeight: '600',
                marginRight: 6,
              }}
            >
              View All
            </CustomText>
            <Icon 
              name="arrow-right" 
              size={14} 
              color={currentColors.primary} 
            />
          </View>
        </CustomButton>
      </Animated.View>

      {/* Song List */}
      <View style={{ minHeight: 200 }}>
        <SongList 
          songs={recentSongs}
          onSongPress={(song) => console.log('Song pressed:', song)}
          currentSongId="1"
        />
      </View>

      {/* Bottom gradient fade */}
      <View 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 40,
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      />
    </AnimatedContainer>
  );
}

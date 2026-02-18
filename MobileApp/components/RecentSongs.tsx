import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { Container } from './Container';
import { CustomText } from './CustomText';
import { SongList } from './musicPlaylist';
import { recentSongs } from '../data/data';
import { CustomButton } from './CustomButton';
import { useAppTheme } from '../util/colorScheme';
import { Feather } from '@expo/vector-icons';

const AnimatedContainer = Animated.createAnimatedComponent(Container);

export function RecentSongsSection() {
  const theme = useAppTheme();
  
  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.9);
  const containerTranslateY = useSharedValue(20);

  useEffect(() => {
    // Staggered entrance animation
    containerOpacity.value = withDelay(300, withSpring(1, { damping: 15 }));
    containerScale.value = withDelay(300, withSpring(1, { damping: 15 }));
    containerTranslateY.value = withDelay(300, withSpring(0, { damping: 15 }));
  }, [containerOpacity, containerScale, containerTranslateY]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [
      { scale: containerScale.value },
      { translateY: containerTranslateY.value }
    ]
  }));

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
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 20,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        },
        containerAnimatedStyle,
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
          backgroundColor: `${theme.colors.primary}08`,
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
              backgroundColor: theme.colors.primary,
              borderRadius: 2,
              marginRight: 12,
            }}
          />
          <CustomText 
            variant="title" 
            style={{ 
              color: theme.colors.text.primary,
              fontWeight: '600',
            }}
          >
            Recent Songs
          </CustomText>
        </View>
        
        <CustomButton
          variant="text"
          size="sm"
          onPress={() => console.log('View all songs')}
          className="rounded-lg px-3 py-2"
          style={{ backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border }}
        >
          <View className="flex-row items-center">
            <CustomText 
              variant="label" 
              style={{ 
                color: theme.colors.primary,
                fontWeight: '600',
                marginRight: 6,
              }}
            >
              View All
            </CustomText>
            <Feather
              name="arrow-right" 
              size={14} 
              color={theme.colors.primary} 
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
          backgroundColor: theme.colors.surface,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      />
    </AnimatedContainer>
  );
}

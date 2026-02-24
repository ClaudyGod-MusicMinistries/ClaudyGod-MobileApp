// components/cards/NowPlayingCard.tsx
import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { CustomText } from './CustomText';
import { MaterialIcons } from '@expo/vector-icons';
import { Flex } from './Flexbox';

interface NowPlayingCardProps {
  song: {
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: string;
    imageUrl: string;
  };
  isPlaying?: boolean;
  onPress?: () => void;
  onPlayPause?: () => void;
}

export const NowPlayingCard: React.FC<NowPlayingCardProps> = ({
  song,
  isPlaying = false,
  onPress: _onPress,
  onPlayPause
}) => {
  return (
    <View className="bg-gray-900 rounded-2xl p-4 mx-4 mb-4">
      <Flex direction="row" align="center" className="mb-3">
        <View className="w-16 h-16 rounded-lg overflow-hidden mr-3">
          <Image 
            source={{ uri: song.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1">
          <CustomText variant="title" className="text-white font-bold">
            {song.title}
          </CustomText>
          <CustomText variant="caption" className="text-gray-400">
            {song.artist}
          </CustomText>
        </View>
        <TouchableOpacity onPress={onPlayPause} className="p-2">
          <MaterialIcons 
            name={isPlaying ? "pause-circle-filled" : "play-circle-filled"} 
            size={36} 
            color="#E1306C" 
          />
        </TouchableOpacity>
      </Flex>
      
      {/* Progress Bar */}
      <View className="w-full h-1 bg-gray-700 rounded-full mb-2">
        <View className="h-1 bg-purple-500 rounded-full" style={{ width: '30%' }} />
      </View>
      
      <Flex direction="row" justify="between">
        <CustomText variant="caption" className="text-gray-400">0:00</CustomText>
        <CustomText variant="caption" className="text-gray-400">{song.duration}</CustomText>
      </Flex>
    </View>
  );
};

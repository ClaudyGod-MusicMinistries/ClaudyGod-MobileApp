import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';
import { AppButton } from '../ui/AppButton';

type HeroAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
};

interface CinematicHeroCardProps {
  imageSource?: ImageSourcePropType;
  imageUrl?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  height?: number;
  actions?: HeroAction[];
  overlayStrength?: number;
}

export function CinematicHeroCard({
  imageSource,
  imageUrl,
  eyebrow,
  title,
  subtitle,
  description,
  badge,
  height = 360,
  actions = [],
  overlayStrength = 0.94,
}: CinematicHeroCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        height,
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.card,
      }}
    >
      <Image
        source={imageSource ?? { uri: imageUrl }}
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
      />

      <LinearGradient
        colors={[
          'rgba(7,9,12,0.08)',
          'rgba(7,9,12,0.34)',
          `rgba(7,9,12,${overlayStrength})`,
        ]}
        locations={[0, 0.48, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.lg,
          gap: 10,
        }}
      >
        {badge ? (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(12,16,20,0.72)',
            }}
          >
            <CustomText variant="caption" style={{ color: '#F3E8CF' }}>
              {badge}
            </CustomText>
          </View>
        ) : null}

        {eyebrow ? (
          <CustomText
            variant="caption"
            style={{
              color: 'rgba(241,229,204,0.76)',
              textTransform: 'uppercase',
              letterSpacing: 0.9,
            }}
          >
            {eyebrow}
          </CustomText>
        ) : null}

        <View style={{ gap: 6 }}>
          <CustomText variant="hero" style={{ color: '#F8F4EA' }} numberOfLines={2}>
            {title}
          </CustomText>
          {subtitle ? (
            <CustomText variant="subtitle" style={{ color: 'rgba(241,236,225,0.78)' }} numberOfLines={1}>
              {subtitle}
            </CustomText>
          ) : null}
          {description ? (
            <CustomText
              variant="body"
              style={{ color: 'rgba(230,223,210,0.76)', maxWidth: '88%' }}
              numberOfLines={2}
            >
              {description}
            </CustomText>
          ) : null}
        </View>

        {actions.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {actions.map((action) => (
              <AppButton
                key={`${action.label}-${action.icon ?? 'action'}`}
                title={action.label}
                onPress={action.onPress}
                variant={action.variant ?? 'primary'}
                size="sm"
                leftIcon={
                  action.icon ? (
                    <MaterialIcons
                      name={action.icon}
                      size={16}
                      color={action.variant === 'outline' || action.variant === 'ghost' ? theme.colors.text.primary : theme.colors.text.inverse}
                    />
                  ) : undefined
                }
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

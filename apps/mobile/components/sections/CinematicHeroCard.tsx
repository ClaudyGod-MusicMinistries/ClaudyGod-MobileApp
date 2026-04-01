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
  contentSurface?: boolean;
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
  contentSurface = true,
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
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.md,
        }}
      >
        <View style={{ gap: 6 }}>
          <View
            style={
              contentSurface
                ? {
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(8,8,16,0.82)',
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.md,
                    gap: 10,
                  }
                : { gap: 8 }
            }
          >
            {badge ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: theme.radius.pill,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(141,99,255,0.12)',
                }}
              >
                <CustomText variant="caption" style={{ color: '#E7DEFF' }}>
                  {badge}
                </CustomText>
              </View>
            ) : null}

            {eyebrow ? (
              <CustomText
                variant="caption"
                style={{
                  color: 'rgba(226,218,255,0.74)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.75,
                }}
              >
                {eyebrow}
              </CustomText>
            ) : null}

            <View style={{ gap: 4 }}>
              <CustomText variant="hero" style={{ color: '#F7F4FF' }} numberOfLines={2}>
                {title}
              </CustomText>
              {subtitle ? (
                <CustomText variant="subtitle" style={{ color: 'rgba(230,224,246,0.76)' }} numberOfLines={1}>
                  {subtitle}
                </CustomText>
              ) : null}
              {description ? (
                <CustomText
                  variant="body"
                  style={{ color: 'rgba(221,214,238,0.72)', maxWidth: '86%' }}
                  numberOfLines={2}
                >
                  {description}
                </CustomText>
              ) : null}
            </View>

            {actions.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
                {actions.map((action) => (
                  <AppButton
                    key={`${action.label}-${action.icon ?? 'action'}`}
                    title={action.label}
                    onPress={action.onPress}
                    variant={action.variant ?? 'primary'}
                    size="sm"
                    style={
                      action.variant === 'secondary'
                        ? {
                            borderColor: 'rgba(255,255,255,0.1)',
                            backgroundColor: 'rgba(11,13,22,0.86)',
                          }
                        : action.variant === 'primary'
                          ? {
                              backgroundColor: '#8D63FF',
                            }
                          : undefined
                    }
                    textColor={action.variant === 'secondary' ? '#F7F4FF' : undefined}
                    leftIcon={
                      action.icon ? (
                        <MaterialIcons
                          name={action.icon}
                          size={16}
                          color={action.variant === 'outline' || action.variant === 'ghost' ? theme.colors.text : theme.colors.textInverse}
                        />
                      ) : undefined
                    }
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

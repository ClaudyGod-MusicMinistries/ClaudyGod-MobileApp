import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../util/colorScheme';
import { CustomText } from '../CustomText';
import { AppButton } from '../ui/AppButton';
import { TVTouchable } from '../ui/TVTouchable';
import { apiFetch } from '../../services/apiClient';

interface AdData {
  id: string;
  sponsorName: string;
  headline: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

interface AdBannerProps {
  placement: string;
}

export function AdBanner({ placement }: AdBannerProps) {
  const theme = useAppTheme();
  const [ad, setAd] = useState<AdData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const impressionSent = useRef(false);

  useEffect(() => {
    let mounted = true;

    void apiFetch<{ ad: AdData | null }>(
      `/v1/mobile/ads?placement=${encodeURIComponent(placement)}`,
    )
      .then((result) => {
        if (mounted && result.ad) {
          setAd(result.ad);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      })
      .catch(() => {
        // Backend not yet available — degrade silently
      });

    return () => { mounted = false; };
  }, [placement, fadeAnim]);

  // Track impression once when ad becomes visible
  useEffect(() => {
    if (ad && !impressionSent.current) {
      impressionSent.current = true;
      void apiFetch(`/v1/mobile/ads/${ad.id}/impression`, { method: 'POST' }).catch(() => {});
    }
  }, [ad]);

  const handleClick = () => {
    if (!ad) return;
    void apiFetch(`/v1/mobile/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});
  };

  const handleDismiss = () => {
    if (!ad) return;
    void apiFetch(`/v1/mobile/ads/${ad.id}/dismiss`, { method: 'POST' }).catch(() => {});
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDismissed(true);
    });
  };

  if (!ad || dismissed) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View
        style={{
          borderRadius: 16,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 14,
          gap: 10,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View
              style={{
                backgroundColor: theme.colors.primarySurface,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: theme.colors.primaryBorder,
              }}
            >
              <CustomText style={{ color: theme.colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Sponsored
              </CustomText>
            </View>
            <CustomText style={{ color: theme.colors.textMuted, fontSize: 11.5, fontWeight: '500' }}>
              {ad.sponsorName}
            </CustomText>
          </View>
          <TVTouchable
            onPress={handleDismiss}
            showFocusBorder={false}
            style={{
              width: 26, height: 26, borderRadius: 13,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: theme.colors.subtleFill,
            }}
          >
            <MaterialIcons name="close" size={14} color={theme.colors.textMuted} />
          </TVTouchable>
        </View>

        {/* Content */}
        <CustomText style={{ color: theme.colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20 }}>
          {ad.headline}
        </CustomText>

        {ad.body ? (
          <CustomText style={{ color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18 }} numberOfLines={3}>
            {ad.body}
          </CustomText>
        ) : null}

        {/* CTA */}
        {ad.ctaLabel ? (
          <AppButton
            title={ad.ctaLabel}
            variant="secondary"
            size="sm"
            onPress={handleClick}
            leftIcon={<MaterialIcons name="open-in-new" size={14} color={theme.colors.text} />}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

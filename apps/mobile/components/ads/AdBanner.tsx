import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../util/colorScheme';
import { makeStyles } from '../../styles/makeStyles';
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: 16, backgroundColor: theme.colors.card,
    borderWidth: 1, borderColor: theme.colors.border,
    padding: 14, gap: 10,
  },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sponsorRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sponsoredPill: {
    backgroundColor: theme.colors.primarySurface, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: theme.colors.primaryBorder,
  },
  sponsoredText: {
    color: theme.colors.primary, fontSize: 9, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  sponsorName:  { color: theme.colors.textMuted, fontSize: 11.5, fontWeight: '500' },
  dismissBtn: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.subtleFill,
  },
  headline: { color: theme.colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  bodyText: { color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18 },
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function AdBanner({ placement }: AdBannerProps) {
  const styles = useStyles();
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
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.sponsorRow}>
            <View style={styles.sponsoredPill}>
              <CustomText style={styles.sponsoredText}>Sponsored</CustomText>
            </View>
            <CustomText style={styles.sponsorName}>{ad.sponsorName}</CustomText>
          </View>
          <TVTouchable onPress={handleDismiss} showFocusBorder={false} style={styles.dismissBtn}>
            <MaterialIcons name="close" size={14} color={theme.colors.textMuted} />
          </TVTouchable>
        </View>

        <CustomText style={styles.headline}>{ad.headline}</CustomText>

        {ad.body ? (
          <CustomText style={styles.bodyText} numberOfLines={3}>{ad.body}</CustomText>
        ) : null}

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

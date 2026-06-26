import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { CustomText } from '../CustomText';
import { useAppTheme } from '../../util/colorScheme';
import { apiFetch } from '../../services/apiClient';

const POLL_INTERVAL_MS = 15_000;

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function WorshipTogetherBar({ contentId }: { contentId: string }) {
  const theme = useAppTheme();
  const [count, setCount] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!contentId) return;
    let mounted = true;

    const fetchCount = async () => {
      try {
        const result = await apiFetch<{ count: number }>(
          `/v1/mobile/worship/count?contentId=${encodeURIComponent(contentId)}`,
        );
        if (mounted && typeof result.count === 'number') {
          setCount(result.count);
        }
      } catch {
        // Backend not yet available — degrade silently
      }
    };

    void fetchCount();
    const interval = setInterval(() => void fetchCount(), POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [contentId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: count !== null && count > 0 ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [count, fadeAnim]);

  if (count === null || count === 0) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', paddingVertical: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          backgroundColor: `${theme.colors.primary}14`,
          borderWidth: 1,
          borderColor: theme.colors.primaryBorder,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 7,
        }}
      >
        {/* Live indicator dot */}
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success }} />
        <MaterialIcons name="people" size={13} color={theme.colors.primary} />
        <CustomText style={{ color: theme.colors.primary, fontSize: 12.5, fontWeight: '700' }}>
          {formatCount(count)} worshipping together
        </CustomText>
      </View>
    </Animated.View>
  );
}

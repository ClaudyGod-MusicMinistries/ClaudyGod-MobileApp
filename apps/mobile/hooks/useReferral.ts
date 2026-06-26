import { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../services/apiClient';

const STORAGE_KEY_CODE = 'claudygod.referral.code';
const STORAGE_KEY_COUNT = 'claudygod.referral.count';
const SHARE_BASE_URL = 'https://claudygod.com/join';

function deriveCodeFromDeviceId(deviceId: string): string {
  const clean = deviceId.replace(/-/g, '').toUpperCase();
  return `CG${clean.slice(0, 6)}`;
}

export interface ReferralState {
  code: string | null;
  referralCount: number;
  shareUrl: string | null;
  isLoading: boolean;
  share: () => Promise<void>;
  copyCode: () => void;
  isCopied: boolean;
}

async function fetchReferralCount(): Promise<number> {
  try {
    const res = await apiFetch<{ count: number }>('/v1/mobile/referral-count');
    return res.count ?? 0;
  } catch {
    return 0;
  }
}

export function useReferral(): ReferralState {
  const { deviceId } = useAppContext();
  const [code, setCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_CODE);
        const derived = deriveCodeFromDeviceId(deviceId);
        const resolved = stored ?? derived;

        if (!stored) {
          await AsyncStorage.setItem(STORAGE_KEY_CODE, resolved);
        }

        // Fetch live count from backend, fall back to cached count
        const [liveCount, cachedRaw] = await Promise.allSettled([
          fetchReferralCount(),
          AsyncStorage.getItem(STORAGE_KEY_COUNT),
        ]);

        let count = 0;
        if (liveCount.status === 'fulfilled') {
          count = liveCount.value;
          await AsyncStorage.setItem(STORAGE_KEY_COUNT, String(count));
        } else if (cachedRaw.status === 'fulfilled' && cachedRaw.value) {
          count = parseInt(cachedRaw.value, 10) || 0;
        }

        if (active) {
          setCode(resolved);
          setReferralCount(count);
        }
      } catch {
        // referral not critical — silent
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [deviceId]);

  const shareUrl = code ? `${SHARE_BASE_URL}?ref=${code}` : null;

  const share = useCallback(async () => {
    if (!code || !shareUrl) return;
    try {
      await Share.share({
        title: 'Join me on ClaudyGod',
        message:
          `I'm listening to worship music and sermons on ClaudyGod — join me! Use my code ${code} to get started.\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // user cancelled or share not available — silent
    }
  }, [code, shareUrl]);

  const copyCode = useCallback(() => {
    if (!code) return;
    void Clipboard.setStringAsync(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [code]);

  return { code, referralCount, shareUrl, isLoading, share, copyCode, isCopied };
}

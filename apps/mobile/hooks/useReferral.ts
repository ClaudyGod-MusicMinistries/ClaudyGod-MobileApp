import { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY_CODE = 'claudygod.referral.code';
const STORAGE_KEY_COUNT = 'claudygod.referral.count';
const SHARE_BASE_URL = 'https://claudygod.com/join';

/** Deterministic 6-char code derived from user ID (uppercase alphanumeric). */
function deriveCodeFromUserId(userId: string): string {
  const clean = userId.replace(/-/g, '').toUpperCase();
  return `CG${clean.slice(0, 6)}`;
}

export interface ReferralState {
  code: string | null;
  referralCount: number;
  shareUrl: string | null;
  isLoading: boolean;
  share: () => Promise<void>;
  copyCode: () => Promise<void>;
  isCopied: boolean;
}

export function useReferral(): ReferralState {
  const { isAuthenticated, user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        if (!isAuthenticated || !user?.id) {
          setCode(null);
          setReferralCount(0);
          return;
        }

        // Derive code from user ID and persist so it's consistent
        const stored = await AsyncStorage.getItem(STORAGE_KEY_CODE);
        const derived = deriveCodeFromUserId(user.id);
        const resolved = stored ?? derived;

        if (!stored) {
          await AsyncStorage.setItem(STORAGE_KEY_CODE, resolved);
        }

        const countRaw = await AsyncStorage.getItem(STORAGE_KEY_COUNT);

        if (active) {
          setCode(resolved);
          setReferralCount(countRaw ? parseInt(countRaw, 10) : 0);
        }
      } catch {
        // graceful — referral not critical
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [isAuthenticated, user?.id]);

  const shareUrl = code ? `${SHARE_BASE_URL}?ref=${code}` : null;

  const share = useCallback(async () => {
    if (!code || !shareUrl) return;
    try {
      await Share.share({
        title: 'Join me on ClaudyGod',
        message:
          `I'm listening to worship music and sermons on ClaudyGod — join me! Use my code ${code} when you sign up for a free account.\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // user cancelled or share not available — silent
    }
  }, [code, shareUrl]);

  const copyCode = useCallback(async () => {
    if (!code) return;
    // Trigger the native share sheet with just the code as a quick "copy" path
    try {
      await Share.share({ message: code, title: 'Your ClaudyGod referral code' });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // user cancelled — silent
    }
  }, [code]);

  return { code, referralCount, shareUrl, isLoading, share, copyCode, isCopied };
}

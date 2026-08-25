import { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAppContext } from '../context/AppContext';
import { apiFetch } from '../services/apiClient';

const SHARE_BASE_URL = 'https://claudygod.org/join';

export interface ReferralState {
  code: string | null;
  referralCount: number;
  shareCount: number;
  shareUrl: string | null;
  isLoading: boolean;
  share: () => Promise<void>;
  copyCode: () => void;
  isCopied: boolean;
}

type ReferralProfile = { referral: { code: string; shareCount: number; joinedCount: number } };

export function useReferral(): ReferralState {
  const { deviceId } = useAppContext();
  const [code, setCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await apiFetch<ReferralProfile>('/v1/mobile/referrals/profile', {
          method: 'POST', body: JSON.stringify({}),
        });
        if (active) {
          setCode(result.referral.code);
          setReferralCount(result.referral.joinedCount);
          setShareCount(result.referral.shareCount);
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
      const result = await Share.share({
        title: 'Join me on ClaudyGod',
        message:
          `I'm listening to worship music and sermons on ClaudyGod — join me! Use my code ${code} to get started.\n\n${shareUrl}`,
        url: shareUrl,
      });
      if (result.action === Share.sharedAction) {
        const updated = await apiFetch<ReferralProfile>('/v1/mobile/referrals/share', {
          method: 'POST', body: JSON.stringify({}),
        });
        setShareCount(updated.referral.shareCount);
        setReferralCount(updated.referral.joinedCount);
      }
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

  return { code, referralCount, shareCount, shareUrl, isLoading, share, copyCode, isCopied };
}

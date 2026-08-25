import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { apiFetch } from '../services/apiClient';

const DEVICE_ID_KEY = 'claudygod.device.id';
const REFERRAL_ATTRIBUTION_KEY = 'claudygod.referral.attributed';

function referralCodeFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    const raw = parsed.queryParams?.ref;
    const code = Array.isArray(raw) ? raw[0] : raw;
    return typeof code === 'string' && /^CG[A-F0-9]{8}$/i.test(code) ? code.toUpperCase() : null;
  } catch {
    return null;
  }
}

async function attributeReferralFromUrl(url: string | null, deviceId: string) {
  const code = referralCodeFromUrl(url);
  if (!code) return;
  const recorded = await AsyncStorage.getItem(REFERRAL_ATTRIBUTION_KEY);
  if (recorded) return;
  const response = await apiFetch<{ attributed: boolean }>('/v1/mobile/referrals/attribute', {
    method: 'POST', body: JSON.stringify({ deviceId, code }),
  });
  if (response.attributed) await AsyncStorage.setItem(REFERRAL_ATTRIBUTION_KEY, code);
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AppContextValue {
  isReady: boolean;
  deviceId: string;
}

const AppContext = createContext<AppContextValue>({ isReady: false, deviceId: '' });

export function AppProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(DEVICE_ID_KEY)
      .then(async (stored) => {
        if (!active) return;
        const id = stored ?? generateUUID();
        if (!stored) await AsyncStorage.setItem(DEVICE_ID_KEY, id);
        setDeviceId(id);
        setIsReady(true);
        void Linking.getInitialURL().then((url) => attributeReferralFromUrl(url, id)).catch(() => undefined);
      })
      .catch(() => {
        if (active) {
          setDeviceId(generateUUID());
          setIsReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!deviceId) return undefined;
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void attributeReferralFromUrl(url, deviceId).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [deviceId]);

  return <AppContext.Provider value={{ isReady, deviceId }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}

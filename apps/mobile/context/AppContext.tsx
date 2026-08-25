import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { apiFetch } from '../services/apiClient';
import { clearInstallationSession, getInstallationSession, saveInstallationSession } from '../lib/installationSessionStorage';

const attributedCodes = new Set<string>();

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

async function attributeReferralFromUrl(url: string | null) {
  const code = referralCodeFromUrl(url);
  if (!code) return;
  if (attributedCodes.has(code)) return;
  const response = await apiFetch<{ attributed: boolean }>('/v1/mobile/referrals/attribute', {
    method: 'POST', body: JSON.stringify({ code }),
  });
  if (response.attributed) attributedCodes.add(code);
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
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const establishInstallation = async () => {
      let session = await getInstallationSession();
      if (session) {
        try {
          const verified = await apiFetch<{ installation: { id: string } }>('/v1/mobile/installations/session');
          session = { ...session, installationId: verified.installation.id };
        } catch {
          await clearInstallationSession();
          session = null;
        }
      }
      if (!session && Platform.OS === 'web') {
        try {
          const verified = await apiFetch<{ installation: { id: string } }>('/v1/mobile/installations/session');
          if (active) {
            setDeviceId(verified.installation.id);
            setIsReady(true);
            void Linking.getInitialURL().then((url) => attributeReferralFromUrl(url)).catch(() => undefined);
          }
          return;
        } catch {
          // No HttpOnly installation session yet; registration below creates it.
        }
      }
      if (!session) {
        const result = await apiFetch<{ installation: { id: string }; credential: string }>('/v1/mobile/installations/register', {
          method: 'POST',
          body: JSON.stringify({ platform: Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : 'unknown', appVersion: Constants.expoConfig?.version ?? undefined }),
        });
        session = { installationId: result.installation.id, credential: result.credential };
        await saveInstallationSession(session);
      }
      if (active) {
        setDeviceId(session.installationId);
        setIsReady(true);
        void Linking.getInitialURL().then((url) => attributeReferralFromUrl(url)).catch(() => undefined);
      }
    };
    const attemptInstallation = () => {
      void establishInstallation().catch(() => {
        if (active) {
          setIsReady(true);
          retryTimer = setTimeout(attemptInstallation, 15_000);
        }
      });
    };
    attemptInstallation();
    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    if (!deviceId) return undefined;
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void attributeReferralFromUrl(url).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [deviceId]);

  return <AppContext.Provider value={{ isReady, deviceId }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}

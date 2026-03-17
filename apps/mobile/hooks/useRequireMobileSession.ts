import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { getStoredMobileSession } from '../services/authService';

export function useRequireMobileSession(): boolean {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsChecking(true);

      void (async () => {
        try {
          const { accessToken } = await getStoredMobileSession();
          if (!isActive) {
            return;
          }

          if (!accessToken) {
            setIsAuthorized(false);
            router.replace('/sign-in');
            return;
          }

          setIsAuthorized(true);
        } catch {
          if (!isActive) {
            return;
          }

          setIsAuthorized(false);
          router.replace('/sign-in');
        } finally {
          if (isActive) {
            setIsChecking(false);
          }
        }
      })();

      return () => {
        isActive = false;
      };
    }, [router]),
  );

  return !isChecking && isAuthorized;
}

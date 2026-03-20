import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_ROUTES } from '../util/appRoutes';

export function useRequireMobileSession(): boolean {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (initializing) {
        setIsChecking(true);
        return undefined;
      }

      if (!isAuthenticated) {
        setIsAuthorized(false);
        setIsChecking(false);
        router.replace(APP_ROUTES.auth.signIn);
        return undefined;
      }

      setIsAuthorized(true);
      setIsChecking(false);
      return undefined;
    }, [initializing, isAuthenticated, router]),
  );

  return !isChecking && isAuthorized;
}

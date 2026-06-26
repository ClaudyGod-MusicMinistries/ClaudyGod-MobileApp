import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_ROUTES } from '../util/appRoutes';

export function useRequireMobileSession(): boolean {
  const router = useRouter();
  const { initializing, isAuthenticated } = useAuth();

  useEffect(() => {
    if (initializing || isAuthenticated) {
      return;
    }

    router.replace(APP_ROUTES.auth.signIn);
  }, [initializing, isAuthenticated, router]);

  return !initializing && isAuthenticated;
}

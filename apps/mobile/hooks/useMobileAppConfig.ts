import { useQuery } from '@tanstack/react-query';
import { fetchMobileAppConfig, type MobileAppExperienceConfig } from '../services/userFlowService';

export function useMobileAppConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['mobileAppConfig'],
    queryFn: async (): Promise<MobileAppExperienceConfig> => (await fetchMobileAppConfig()).config,
  });

  return { config: data ?? null, loading: isLoading };
}

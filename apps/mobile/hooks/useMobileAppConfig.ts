import { useEffect, useState } from 'react';
import { fetchMobileAppConfig, type MobileAppExperienceConfig } from '../services/userFlowService';

export function useMobileAppConfig() {
  const [config, setConfig] = useState<MobileAppExperienceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchMobileAppConfig()
      .then((response) => {
        if (!active) return;
        setConfig(response.config);
      })
      .catch((error) => {
        console.warn('mobile app config fallback:', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { config, loading };
}

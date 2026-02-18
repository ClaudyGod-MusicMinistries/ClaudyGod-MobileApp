import Constants from 'expo-constants';

type ExtraConfig = {
  EXPO_PUBLIC_API_URL?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_EAS_PROJECT_ID?: string;
  eas?: { projectId?: string };
};
type PublicEnvKey =
  | 'EXPO_PUBLIC_API_URL'
  | 'EXPO_PUBLIC_SUPABASE_URL'
  | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  | 'EXPO_PUBLIC_EAS_PROJECT_ID';

const extra =
  (Constants.expoConfig?.extra as ExtraConfig | undefined) ??
  (Constants.manifest?.extra as ExtraConfig | undefined) ??
  {};

const getEnv = (key: PublicEnvKey, fallback = ''): string => {
  const processValue = process.env[key];
  if (typeof processValue === 'string' && processValue.length > 0) {
    return processValue;
  }

  const extraValue = extra[key];
  if (typeof extraValue === 'string' && extraValue.length > 0) {
    return extraValue;
  }

  return fallback;
};

export const ENV = {
  apiUrl: getEnv('EXPO_PUBLIC_API_URL', 'https://api.example.com'),
  supabaseUrl: getEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://your-project.supabase.co'),
  supabaseAnonKey: getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
  easProjectId: getEnv('EXPO_PUBLIC_EAS_PROJECT_ID', extra.eas?.projectId ?? ''),
};

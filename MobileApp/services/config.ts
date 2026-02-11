import Constants from 'expo-constants';

type ExtraConfig = {
  EXPO_PUBLIC_API_URL?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_EAS_PROJECT_ID?: string;
  eas?: { projectId?: string };
};

const extra =
  (Constants.expoConfig?.extra as ExtraConfig | undefined) ??
  (Constants.manifest?.extra as ExtraConfig | undefined) ??
  {};

const getEnv = (key: keyof ExtraConfig, fallback = '') =>
  (process.env[key] as string | undefined) ?? extra[key] ?? fallback;

export const ENV = {
  apiUrl: getEnv('EXPO_PUBLIC_API_URL', 'https://api.example.com'),
  supabaseUrl: getEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://your-project.supabase.co'),
  supabaseAnonKey: getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
  easProjectId: getEnv('EXPO_PUBLIC_EAS_PROJECT_ID', extra.eas?.projectId ?? ''),
};

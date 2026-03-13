import Constants from 'expo-constants';

type ExtraConfig = {
  EXPO_PUBLIC_API_URL?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_KEY?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_EAS_PROJECT_ID?: string;
  eas?: { projectId?: string };
};
type PublicEnvKey =
  | 'EXPO_PUBLIC_API_URL'
  | 'EXPO_PUBLIC_SUPABASE_URL'
  | 'EXPO_PUBLIC_SUPABASE_KEY'
  | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  | 'EXPO_PUBLIC_EAS_PROJECT_ID';

const extra =
  (Constants.expoConfig?.extra as ExtraConfig | undefined) ??
  (Constants.manifest?.extra as ExtraConfig | undefined) ??
  {};

const getProcessEnv = (key: PublicEnvKey): string | undefined => {
  switch (key) {
    case 'EXPO_PUBLIC_API_URL':
      return process.env.EXPO_PUBLIC_API_URL;
    case 'EXPO_PUBLIC_SUPABASE_URL':
      return process.env.EXPO_PUBLIC_SUPABASE_URL;
    case 'EXPO_PUBLIC_SUPABASE_KEY':
      return process.env.EXPO_PUBLIC_SUPABASE_KEY;
    case 'EXPO_PUBLIC_SUPABASE_ANON_KEY':
      return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    case 'EXPO_PUBLIC_EAS_PROJECT_ID':
      return process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    default:
      return undefined;
  }
};

const getEnv = (keys: PublicEnvKey | PublicEnvKey[], fallback = ''): string => {
  const candidates = Array.isArray(keys) ? keys : [keys];

  for (const key of candidates) {
    const processValue = getProcessEnv(key);
    if (typeof processValue === 'string' && processValue.length > 0) {
      return processValue;
    }
  }

  for (const key of candidates) {
    const extraValue = extra[key];
    if (typeof extraValue === 'string' && extraValue.length > 0) {
      return extraValue;
    }
  }

  return fallback;
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const normalizeHostCandidate = (value?: string | null): string => {
  const input = String(value || '').trim();
  if (!input) return '';

  const normalized = input
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .trim();

  if (!normalized || ['localhost', '127.0.0.1', '::1'].includes(normalized)) {
    return '';
  }

  return normalized;
};

const deriveExpoDevHost = (): string => {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.platform?.hostUri,
  ];

  for (const candidate of candidates) {
    const host = normalizeHostCandidate(candidate);
    if (host) {
      return host;
    }
  }

  return '';
};

const explicitApiUrl = trimTrailingSlash(getEnv('EXPO_PUBLIC_API_URL', ''));
const derivedExpoHost = deriveExpoDevHost();
const derivedApiUrl = derivedExpoHost ? `http://${derivedExpoHost}:4000` : '';
const resolvedApiUrl = explicitApiUrl || derivedApiUrl;

export const ENV = {
  apiUrl: resolvedApiUrl,
  apiUrlSource: explicitApiUrl ? ('env' as const) : derivedApiUrl ? ('expo-host' as const) : ('unset' as const),
  expoDevHost: derivedExpoHost,
  supabaseUrl: getEnv('EXPO_PUBLIC_SUPABASE_URL', ''),
  supabasePublishableKey: getEnv(
    ['EXPO_PUBLIC_SUPABASE_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    '',
  ),
  easProjectId: getEnv('EXPO_PUBLIC_EAS_PROJECT_ID', extra.eas?.projectId ?? ''),
};

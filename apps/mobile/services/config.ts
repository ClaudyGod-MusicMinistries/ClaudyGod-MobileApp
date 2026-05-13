import Constants from 'expo-constants';

type ExtraConfig = {
  CLAUDYGOD_ENV?: string;
  EXPO_PUBLIC_API_URL?: string;
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_KEY?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_MOBILE_API_KEY?: string;
  EXPO_PUBLIC_EAS_PROJECT_ID?: string;
  eas?: { projectId?: string };
};
type PublicEnvKey =
  | 'EXPO_PUBLIC_API_URL'
  | 'EXPO_PUBLIC_SUPABASE_URL'
  | 'EXPO_PUBLIC_SUPABASE_KEY'
  | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  | 'EXPO_PUBLIC_MOBILE_API_KEY'
  | 'EXPO_PUBLIC_EAS_PROJECT_ID';

const manifestExtra = (Constants.manifest as { extra?: ExtraConfig } | null | undefined)?.extra;

const extra = (Constants.expoConfig?.extra as ExtraConfig | undefined) ?? manifestExtra ?? {};

const runtimeMode =
  (process.env.CLAUDYGOD_ENV ?? extra.CLAUDYGOD_ENV ?? process.env.NODE_ENV) === 'production'
    ? 'production'
    : 'development';

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
    case 'EXPO_PUBLIC_MOBILE_API_KEY':
      return process.env.EXPO_PUBLIC_MOBILE_API_KEY;
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
const derivedExpoHost = runtimeMode === 'development' ? deriveExpoDevHost() : '';
const derivedApiUrl = derivedExpoHost ? `http://${derivedExpoHost}:4000` : '';
const resolvedApiUrl = explicitApiUrl || derivedApiUrl;
const isPrivateOrLocalUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.trim().toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
    );
  } catch {
    return true;
  }
};

if (runtimeMode === 'production') {
  if (!resolvedApiUrl || !/^https:\/\//i.test(resolvedApiUrl) || isPrivateOrLocalUrl(resolvedApiUrl)) {
    throw new Error('Production mobile builds require a public HTTPS API URL.');
  }

  if (!getEnv('EXPO_PUBLIC_MOBILE_API_KEY', '').trim()) {
    throw new Error('Production mobile builds require EXPO_PUBLIC_MOBILE_API_KEY.');
  }

  if (!getEnv('EXPO_PUBLIC_SUPABASE_URL', '').trim() || !getEnv(['EXPO_PUBLIC_SUPABASE_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'], '').trim()) {
    throw new Error('Production mobile builds require Supabase public auth configuration.');
  }
}

export const ENV = {
  runtimeMode,
  isProduction: runtimeMode === 'production',
  apiUrl: resolvedApiUrl,
  apiUrlSource: explicitApiUrl
    ? ('env' as const)
    : derivedApiUrl
      ? ('expo-host' as const)
      : ('unset' as const),
  expoDevHost: derivedExpoHost,
  supabaseUrl: getEnv('EXPO_PUBLIC_SUPABASE_URL', ''),
  supabasePublishableKey: getEnv(
    ['EXPO_PUBLIC_SUPABASE_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    '',
  ),
  supabaseAnonKey: getEnv(
    ['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_KEY'],
    '',
  ),
  mobileApiKey: getEnv('EXPO_PUBLIC_MOBILE_API_KEY', ''),
  easProjectId: getEnv('EXPO_PUBLIC_EAS_PROJECT_ID', extra.eas?.projectId ?? ''),
};

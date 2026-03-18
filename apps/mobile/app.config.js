/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const envMode =
  process.env.CLAUDYGOD_ENV === 'production' || process.env.NODE_ENV === 'production'
    ? 'production'
    : 'development';
const envFilePath = path.join(repoRoot, `.env.${envMode}`);

const stripOuterQuotes = (value) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const output = {};
  const source = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripOuterQuotes(line.slice(separatorIndex + 1).trim());
    output[key] = value;
  }

  return output;
};

const fileEnv = parseEnvFile(envFilePath);
const publicSupabaseKey =
  fileEnv.EXPO_PUBLIC_SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
const resolvedSupabaseAnonKey =
  fileEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  publicSupabaseKey;
const resolvedEasProjectId =
  fileEnv.EXPO_PUBLIC_EAS_PROJECT_ID ||
  fileEnv.EAS_PROJECT_ID ||
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  process.env.EAS_PROJECT_ID ||
  '';
const resolvedExpoOwner =
  fileEnv.EXPO_ACCOUNT_OWNER || process.env.EXPO_ACCOUNT_OWNER || '';

const seedEnv = (key, value) => {
  if (typeof value !== 'string' || value.length === 0 || key in process.env) {
    return;
  }

  switch (key) {
    case 'EXPO_PUBLIC_API_URL':
      process.env.EXPO_PUBLIC_API_URL = value;
      break;
    case 'EXPO_PUBLIC_SUPABASE_URL':
      process.env.EXPO_PUBLIC_SUPABASE_URL = value;
      break;
    case 'EXPO_PUBLIC_SUPABASE_KEY':
      process.env.EXPO_PUBLIC_SUPABASE_KEY = value;
      break;
    case 'EXPO_PUBLIC_SUPABASE_ANON_KEY':
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = value;
      break;
    case 'EXPO_PUBLIC_EAS_PROJECT_ID':
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID = value;
      break;
    case 'CLAUDYGOD_ENV':
      process.env.CLAUDYGOD_ENV = value;
      break;
    case 'NODE_ENV':
      process.env.NODE_ENV = value;
      break;
    default:
      break;
  }
};

seedEnv('EXPO_PUBLIC_API_URL', fileEnv.EXPO_PUBLIC_API_URL);
seedEnv('EXPO_PUBLIC_SUPABASE_URL', fileEnv.EXPO_PUBLIC_SUPABASE_URL);
seedEnv('EXPO_PUBLIC_SUPABASE_KEY', publicSupabaseKey);
seedEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', resolvedSupabaseAnonKey);
seedEnv('EXPO_PUBLIC_EAS_PROJECT_ID', resolvedEasProjectId);
seedEnv('CLAUDYGOD_ENV', fileEnv.CLAUDYGOD_ENV);
seedEnv('NODE_ENV', fileEnv.NODE_ENV);

const getEnv = (keys, fallback = '') => {
  const candidates = Array.isArray(keys) ? keys : [keys];

  for (const key of candidates) {
    switch (key) {
      case 'EXPO_PUBLIC_API_URL':
        if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
        break;
      case 'EXPO_PUBLIC_SUPABASE_URL':
        if (process.env.EXPO_PUBLIC_SUPABASE_URL) return process.env.EXPO_PUBLIC_SUPABASE_URL;
        break;
      case 'EXPO_PUBLIC_SUPABASE_KEY':
        if (process.env.EXPO_PUBLIC_SUPABASE_KEY) return process.env.EXPO_PUBLIC_SUPABASE_KEY;
        break;
      case 'EXPO_PUBLIC_SUPABASE_ANON_KEY':
        if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        break;
      case 'EXPO_PUBLIC_EAS_PROJECT_ID':
        if (process.env.EXPO_PUBLIC_EAS_PROJECT_ID) return process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
        break;
      default:
        break;
    }
  }

  return fallback;
};

module.exports = {
  expo: {
    name: 'ClaudyGod App',
    slug: 'MobileApp',
    ...(resolvedExpoOwner ? { owner: resolvedExpoOwner } : {}),
    scheme: 'claudygod',
    version: '1.0.0',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    runtimeVersion: {
      policy: 'appVersion',
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#06040D',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.claudygod.app',
      buildNumber: '1',
    },
    android: {
      package: 'com.claudygod.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#06040D',
      },
      edgeToEdgeEnabled: true,
      versionCode: 1,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    ...(resolvedEasProjectId
      ? {
          updates: {
            url: `https://u.expo.dev/${resolvedEasProjectId}`,
          },
        }
      : {}),
    extra: {
      CLAUDYGOD_ENV: process.env.CLAUDYGOD_ENV || envMode,
      EXPO_PUBLIC_API_URL: getEnv('EXPO_PUBLIC_API_URL', ''),
      EXPO_PUBLIC_SUPABASE_URL: getEnv('EXPO_PUBLIC_SUPABASE_URL', ''),
      EXPO_PUBLIC_SUPABASE_KEY: getEnv('EXPO_PUBLIC_SUPABASE_KEY', ''),
      EXPO_PUBLIC_SUPABASE_ANON_KEY: getEnv(
        ['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_KEY'],
        '',
      ),
      EXPO_PUBLIC_EAS_PROJECT_ID: getEnv('EXPO_PUBLIC_EAS_PROJECT_ID', resolvedEasProjectId),
      ...(resolvedEasProjectId
        ? {
            eas: {
              projectId: resolvedEasProjectId,
            },
          }
        : {}),
    },
    plugins: ['expo-font', 'expo-router', 'expo-web-browser', 'expo-notifications', 'expo-updates'],
  },
};

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
const publicMobileApiKey =
  fileEnv.EXPO_PUBLIC_MOBILE_API_KEY || process.env.EXPO_PUBLIC_MOBILE_API_KEY || '';
const appIconAssetPath = './assets/icon.png';
const appSplashAssetPath = './assets/splash-icon.png';
const appAdaptiveIconAssetPath = './assets/adaptive-icon.png';
const appFaviconAssetPath = './assets/favicon.png';

const getFileOrEnv = (key, fallback = '') =>
  fileEnv[key] || process.env[key] || fallback;

const appName = getFileOrEnv('EXPO_APP_NAME', 'ClaudyGod');
const appSlug = getFileOrEnv('EXPO_APP_SLUG', 'claudygod');
const appScheme = getFileOrEnv('EXPO_APP_SCHEME', 'claudygod');
const appVersion = getFileOrEnv('EXPO_APP_VERSION', '1.0.0');
const appDescription = getFileOrEnv(
  'EXPO_APP_DESCRIPTION',
  'ClaudyGod worship, ministry updates, and secure account access across mobile and web.',
);
const uiStyle = getFileOrEnv('EXPO_USER_INTERFACE_STYLE', 'dark');
const splashBgColor = getFileOrEnv('EXPO_SPLASH_BG_COLOR', '#06040D');
const iosBundleId = getFileOrEnv('EXPO_IOS_BUNDLE_ID', 'com.claudygod.app');
const iosBuildNumber = getFileOrEnv('EXPO_IOS_BUILD_NUMBER', '1');
const iosSupportsTablet = getFileOrEnv('EXPO_IOS_SUPPORTS_TABLET', 'true') !== 'false';
const androidPackage = getFileOrEnv('EXPO_ANDROID_PACKAGE', 'com.claudygod.app');
const androidVersionCode = parseInt(getFileOrEnv('EXPO_ANDROID_VERSION_CODE', '1'), 10);
const androidEdgeToEdge = getFileOrEnv('EXPO_ANDROID_EDGE_TO_EDGE', 'true') !== 'false';

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
    case 'EXPO_PUBLIC_MOBILE_API_KEY':
      process.env.EXPO_PUBLIC_MOBILE_API_KEY = value;
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
seedEnv('EXPO_PUBLIC_MOBILE_API_KEY', publicMobileApiKey);
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
      case 'EXPO_PUBLIC_MOBILE_API_KEY':
        if (process.env.EXPO_PUBLIC_MOBILE_API_KEY) return process.env.EXPO_PUBLIC_MOBILE_API_KEY;
        break;
      default:
        break;
    }
  }

  return fallback;
};

module.exports = {
  expo: {
    name: appName,
    slug: appSlug,
    ...(resolvedExpoOwner ? { owner: resolvedExpoOwner } : {}),
    scheme: appScheme,
    version: appVersion,
    orientation: 'default',
    icon: appIconAssetPath,
    userInterfaceStyle: uiStyle,
    newArchEnabled: true,
    description: appDescription,
    ...(envMode === 'production'
      ? { runtimeVersion: { policy: 'appVersion' } }
      : {}),
    splash: {
      image: appSplashAssetPath,
      resizeMode: 'contain',
      backgroundColor: splashBgColor,
    },
    ios: {
      supportsTablet: iosSupportsTablet,
      bundleIdentifier: iosBundleId,
      buildNumber: iosBuildNumber,
      icon: appIconAssetPath,
      infoPlist: {
        NSCameraUsageDescription: 'ClaudyGod uses your camera to update your profile photo.',
        NSMicrophoneUsageDescription: 'ClaudyGod uses your microphone to record audio messages.',
        NSPhotoLibraryUsageDescription: 'ClaudyGod accesses your photo library to let you choose a profile photo or upload content.',
      },
    },
    android: {
      package: androidPackage,
      icon: appIconAssetPath,
      adaptiveIcon: {
        foregroundImage: appAdaptiveIconAssetPath,
        backgroundColor: splashBgColor,
      },
      edgeToEdgeEnabled: androidEdgeToEdge,
      versionCode: androidVersionCode,
    },
    web: {
      favicon: appFaviconAssetPath,
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
      EXPO_PUBLIC_MOBILE_API_KEY: getEnv('EXPO_PUBLIC_MOBILE_API_KEY', publicMobileApiKey),
      ...(resolvedEasProjectId
        ? {
            eas: {
              projectId: resolvedEasProjectId,
            },
          }
        : {}),
    },
    plugins: [
      'expo-font',
      'expo-router',
      'expo-web-browser',
      'expo-notifications',
      'expo-updates',
      [
        'expo-camera',
        {
          cameraPermission: 'ClaudyGod uses your camera to update your profile photo.',
          microphonePermission: 'ClaudyGod uses your microphone to record audio messages.',
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'ClaudyGod accesses your photo library to let you choose a profile photo or upload content.',
        },
      ],
    ],
  },
};

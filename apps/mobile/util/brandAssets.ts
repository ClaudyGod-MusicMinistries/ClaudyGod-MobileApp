import { Asset } from 'expo-asset';

export const BRAND_LOGO_ASSET = require('../assets/images/ClaudyGoLogo.webp');
export const BRAND_HERO_ASSET = require('../assets/images/FB_IMG_1743103252303.jpg');
export const BRAND_COVER_ASSET = require('../assets/images/CoverArt.webp');

function resolveBrandAssetUri(moduleId: number): string {
  try {
    return Asset.fromModule(moduleId).uri;
  } catch {
    return '';
  }
}

export const BRAND_LOGO_URI = resolveBrandAssetUri(BRAND_LOGO_ASSET);
export const BRAND_HERO_URI = resolveBrandAssetUri(BRAND_HERO_ASSET);
export const BRAND_COVER_URI = resolveBrandAssetUri(BRAND_COVER_ASSET);
export const DEFAULT_CONTENT_IMAGE_URI = BRAND_COVER_URI || BRAND_HERO_URI || BRAND_LOGO_URI;

import { Image } from 'react-native';

export const BRAND_LOGO_ASSET = require('../assets/images/ClaudyGoLogo.webp');
export const BRAND_HERO_ASSET = require('../assets/images/FB_IMG_1743103252303.jpg');
export const BRAND_COVER_ASSET = require('../assets/images/CoverArt.webp');
export const BRAND_LOGO_URI = Image.resolveAssetSource(BRAND_LOGO_ASSET).uri;
export const BRAND_HERO_URI = Image.resolveAssetSource(BRAND_HERO_ASSET).uri;
export const BRAND_COVER_URI = Image.resolveAssetSource(BRAND_COVER_ASSET).uri;
export const DEFAULT_CONTENT_IMAGE_URI = BRAND_COVER_URI;

import { Image } from 'react-native';

export const BRAND_LOGO_ASSET = require('../assets/images/ClaudyGoLogo.webp');
export const BRAND_LOGO_URI = Image.resolveAssetSource(BRAND_LOGO_ASSET).uri;
export const DEFAULT_CONTENT_IMAGE_URI = BRAND_LOGO_URI;

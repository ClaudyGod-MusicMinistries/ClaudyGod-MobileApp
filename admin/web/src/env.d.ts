/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_LOGIN_URL: string;
  readonly VITE_MOBILE_PREVIEW_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

let loaded = false;

/** Load the repository environment file once; validation is process-specific. */
export const loadEnvironment = (): void => {
  if (loaded) return;
  loaded = true;

  const runtimeEnv =
    process.env.CLAUDYGOD_ENV === 'production' || process.env.NODE_ENV === 'production'
      ? 'production'
      : 'development';
  const envFileName = `.env.${runtimeEnv}`;
  const repoRoot = path.resolve(__dirname, '../../../../');
  const candidates = [
    path.resolve(process.cwd(), envFileName),
    path.resolve(process.cwd(), '../..', envFileName),
    path.resolve(repoRoot, envFileName),
  ];
  const candidate = candidates.find((value) => fs.existsSync(value));
  if (candidate) dotenv.config({ path: candidate });
};

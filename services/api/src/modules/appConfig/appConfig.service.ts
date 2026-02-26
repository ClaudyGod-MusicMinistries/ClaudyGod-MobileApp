import { pool } from '../../db/pool';
import { DEFAULT_MOBILE_APP_CONFIG } from './appConfig.defaults';
import { mobileAppConfigSchema, type MobileAppConfig } from './appConfig.schema';

const MOBILE_APP_CONFIG_KEY = 'mobile_app_experience';

interface AppConfigRow {
  config_value: unknown;
  updated_at: string | Date;
}

const validateConfig = (value: unknown): MobileAppConfig => mobileAppConfigSchema.parse(value);

export const getMobileAppConfig = async (): Promise<{
  config: MobileAppConfig;
  meta: { key: string; updatedAt: string };
}> => {
  const result = await pool.query<AppConfigRow>(
    `SELECT config_value, updated_at
     FROM app_config_store
     WHERE config_key = $1
     LIMIT 1`,
    [MOBILE_APP_CONFIG_KEY],
  );

  if (result.rowCount === 0) {
    const inserted = await pool.query<AppConfigRow>(
      `INSERT INTO app_config_store (config_key, config_value)
       VALUES ($1, $2::jsonb)
       RETURNING config_value, updated_at`,
      [MOBILE_APP_CONFIG_KEY, JSON.stringify(DEFAULT_MOBILE_APP_CONFIG)],
    );
    return {
      config: DEFAULT_MOBILE_APP_CONFIG,
      meta: {
        key: MOBILE_APP_CONFIG_KEY,
        updatedAt: new Date(inserted.rows[0]!.updated_at).toISOString(),
      },
    };
  }

  return {
    config: validateConfig(result.rows[0]!.config_value),
    meta: {
      key: MOBILE_APP_CONFIG_KEY,
      updatedAt: new Date(result.rows[0]!.updated_at).toISOString(),
    },
  };
};

export const updateMobileAppConfig = async (params: {
  config: MobileAppConfig;
  updatedByUserId: string;
}): Promise<{
  config: MobileAppConfig;
  meta: { key: string; updatedAt: string };
}> => {
  const config = validateConfig(params.config);

  const result = await pool.query<AppConfigRow>(
    `INSERT INTO app_config_store (config_key, config_value, updated_by)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (config_key)
     DO UPDATE SET
       config_value = EXCLUDED.config_value,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()
     RETURNING config_value, updated_at`,
    [MOBILE_APP_CONFIG_KEY, JSON.stringify(config), params.updatedByUserId],
  );

  return {
    config,
    meta: {
      key: MOBILE_APP_CONFIG_KEY,
      updatedAt: new Date(result.rows[0]!.updated_at).toISOString(),
    },
  };
};

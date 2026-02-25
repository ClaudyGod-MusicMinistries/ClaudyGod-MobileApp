import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export let supabaseAdmin: SupabaseClient | null = null;

if (env.SUPABASE_ENABLED) {
  supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

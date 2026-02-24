import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

export let supabaseAdmin: SupabaseClient | null = null;

if (config.supabase.enabled) {
  supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

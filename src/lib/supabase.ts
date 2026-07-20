// Server-side Supabase client — the SERVICE_ROLE key lives ONLY here (Vercel env
// var), never in the browser. Without envs configured, the endpoints return 503.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.SUPABASE_URL;
const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export const NOT_CONFIGURED = JSON.stringify({
  error: 'not_configured',
  message: 'Global ranking not configured yet (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).',
});

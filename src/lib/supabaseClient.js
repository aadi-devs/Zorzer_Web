import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your environment variables.');
}

// Regular client — uses anon key, respects RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep the Supabase session in the browser so page reloads do not require
    // the user to authenticate again. Supabase refreshes the access token as needed.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE';

// Use placeholders if not configured to prevent @supabase/supabase-js from throwing an empty URL error on load
const url = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const key = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(url, key);


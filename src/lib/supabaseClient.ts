import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const sanitize = (val: any) => {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^['"]|['"]$/g, '');
};

const supabaseUrl = sanitize(rawUrl);
const supabaseAnonKey = sanitize(rawKey);

const isValidUrl = (urlStr: string) => {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
  !supabaseUrl.includes('placeholder-project') &&
  isValidUrl(supabaseUrl);

const url = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const key = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(url, key);

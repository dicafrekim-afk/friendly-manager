
import { createClient } from '@supabase/supabase-js';

// Use process.env as defined in vite.config.ts to avoid ImportMeta errors
const SUPABASE_URL = (process.env as any).VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (process.env as any).VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  SUPABASE_URL !== '' && 
  SUPABASE_ANON_KEY !== '';

if (!isSupabaseConfigured) {
  console.log('Supabase가 설정되지 않았습니다. 로컬 스토리지 모드로 동작합니다.');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);
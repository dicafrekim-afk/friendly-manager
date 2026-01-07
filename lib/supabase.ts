
import { createClient } from '@supabase/supabase-js';

// Vite의 define 설정을 통해 process.env로 주입된 변수를 사용합니다.
const env = process.env as any;
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  SUPABASE_URL !== '' && 
  SUPABASE_ANON_KEY !== '';

if (!isSupabaseConfigured) {
  console.warn('Supabase 설정이 감지되지 않았습니다. 로컬 저장소 모드로 전환합니다.');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);

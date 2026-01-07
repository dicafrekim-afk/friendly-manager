
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  // Vite의 표준인 VITE_ 접두사 우선 확인 후, 접두사 없는 버전도 확인
  return (import.meta as any).env?.[`VITE_${key}`] || 
         (import.meta as any).env?.[key] || 
         (process.env as any)?.[`VITE_${key}`] || 
         (process.env as any)?.[key] || 
         "";
};

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = 
  SUPABASE_URL !== '' && 
  SUPABASE_ANON_KEY !== '';

if (!isSupabaseConfigured) {
  console.warn('⚠️ [Friendly] Supabase 설정이 부족합니다. (URL 또는 Anon Key 누락)');
  console.log('현재 설정 상태:', { 
    url: SUPABASE_URL ? '설정됨' : '미설정', 
    key: SUPABASE_ANON_KEY ? '설정됨' : '미설정' 
  });
} else {
  console.log('✅ [Friendly] Supabase 클라우드 데이터베이스에 연결되었습니다.');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);

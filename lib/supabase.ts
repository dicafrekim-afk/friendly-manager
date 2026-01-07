import { createClient } from '@supabase/supabase-js';

// Use process.env which is mapped via vite.config.ts to avoid import.meta errors
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

// 설정이 올바르게 되었는지 검증 (공백이나 placeholder 제거)
export const isSupabaseConfigured = 
  SUPABASE_URL.length > 10 && 
  SUPABASE_ANON_KEY.length > 10 && 
  !SUPABASE_URL.includes('placeholder');

// 개발자 도구 콘솔에서 상태를 명확하게 확인할 수 있도록 출력
console.group('🌐 [Friendly] Supabase Connection Status');
if (isSupabaseConfigured) {
  console.log('%c✅ Cloud Sync: ACTIVE', 'color: #10b981; font-weight: bold');
} else {
  console.warn('%c⚠️ Cloud Sync: INACTIVE (Local Mode)', 'color: #f59e0b; font-weight: bold');
  console.info('Tip: Vercel 환경 변수에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 있는지 확인하세요.');
}
console.groupEnd();

// 클라이언트 생성
export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder'
);
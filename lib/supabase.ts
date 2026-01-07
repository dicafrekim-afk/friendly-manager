import { createClient } from '@supabase/supabase-js';

// Vite는 빌드 시 import.meta.env를 실제 환경 변수 값으로 치환합니다.
// Fix: Property 'env' does not exist on type 'ImportMeta' by casting to any to bypass strict type checking
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || "";
// Fix: Property 'env' does not exist on type 'ImportMeta' by casting to any to bypass strict type checking
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

// 배포 환경 디버깅 로그
console.group('🌐 [Friendly] Database Connection Status');
if (!isSupabaseConfigured) {
  console.warn('상태: ⚠️ Local Storage Mode');
  console.info('정보: VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 비어있습니다.');
} else {
  console.log('상태: ✅ Cloud DB Connected');
  console.log('URL:', SUPABASE_URL.substring(0, 15) + '...');
}
console.groupEnd();

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);
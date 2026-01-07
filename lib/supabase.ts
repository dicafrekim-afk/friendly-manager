
import { createClient } from '@supabase/supabase-js';

// Vite 표준 환경변수 접근 방식
// Vercel 배포 시 VITE_로 시작하는 변수들이 이 곳에 주입됩니다.
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

// 디버깅 로그 개선
console.group('🌐 [Friendly] Database Status');
if (!isSupabaseConfigured) {
  console.warn('상태: ⚠️ Local Storage Mode');
  console.log('확인된 URL:', SUPABASE_URL ? '존재함' : '없음');
  console.log('확인된 KEY:', SUPABASE_ANON_KEY ? '존재함' : '없음');
} else {
  console.log('상태: ✅ Cloud DB Connected');
}
console.groupEnd();

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);

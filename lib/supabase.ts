
import { createClient } from '@supabase/supabase-js';

// Use process.env instead of import.meta.env as configured in vite.config.ts
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

// 디버깅을 위한 상세 로그 (개발자 도구에서 확인 가능)
console.group('🌐 [Friendly] Database Status');
if (!isSupabaseConfigured) {
  console.warn('상태: ⚠️ 로컬 저장소 모드 (환경 변수 미설정)');
  console.log('필요한 변수:', { 
    VITE_SUPABASE_URL: SUPABASE_URL ? '✅ 설정됨' : '❌ 미설정', 
    VITE_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 미설정' 
  });
} else {
  console.log('상태: ✅ 클라우드 DB 연결됨');
  console.log('연결 주소:', SUPABASE_URL);
}
console.groupEnd();

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);
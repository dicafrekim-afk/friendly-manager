
import { createClient } from '@supabase/supabase-js';

// Vite의 import.meta.env와 process.env를 모두 체크하여 유연성을 높입니다.
// Fix: Cast import.meta to any to bypass TypeScript error "Property 'env' does not exist on type 'ImportMeta'".
const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL) || (process.env?.VITE_SUPABASE_URL) || "";
const SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || (process.env?.VITE_SUPABASE_ANON_KEY) || "";

export const isSupabaseConfigured = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

// 디버깅을 위한 상세 로그
console.group('🌐 [Friendly] Database Status');
if (!isSupabaseConfigured) {
  console.warn('상태: ⚠️ 로컬 저장소 모드 (환경 변수가 배포에 반영되지 않았습니다)');
  console.log('필요한 변수 확인:', { 
    VITE_SUPABASE_URL: SUPABASE_URL ? '✅ 로드됨' : '❌ 누락됨', 
    VITE_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '✅ 로드됨' : '❌ 누락됨' 
  });
  console.info('조치 방법: Vercel의 Deployments 메뉴에서 [Redeploy]를 실행해 주세요.');
} else {
  console.log('상태: ✅ 클라우드 DB 연결 성공');
}
console.groupEnd();

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);
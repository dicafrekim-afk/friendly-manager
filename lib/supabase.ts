import { createClient } from '@supabase/supabase-js';

/**
 * Vite 환경 변수 안전하게 가져오기
 * import.meta.env가 존재하지 않거나 특정 키가 없을 경우 빈 문자열을 반환합니다.
 */
const getEnv = (key: string): string => {
  try {
    const env = (import.meta as any).env;
    return (env && env[key]) ? String(env[key]).trim() : "";
  } catch (e) {
    return "";
  }
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// 설정 완료 여부 확인
export const isSupabaseConfigured = SUPABASE_URL.length > 0 && 
                                    SUPABASE_ANON_KEY.length > 0 && 
                                    !SUPABASE_URL.includes('placeholder');

// 콘솔에 현재 연결 상태를 출력 (디버깅용)
console.group('🌐 [Friendly] Supabase Setup Check');
if (isSupabaseConfigured) {
  console.log('%c✅ Cloud Database: CONNECTED', 'color: #10b981; font-weight: bold');
  console.log('Project URL:', SUPABASE_URL.substring(0, 25) + '...');
} else {
  console.warn('%c⚠️ Mode: LOCAL STORAGE ONLY', 'color: #f59e0b; font-weight: bold');
  console.info('원인: VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  console.info('조치: Vercel 환경 변수 설정 후 [Redeploy] 시 "Build Cache"를 끄고 진행하세요.');
}
console.groupEnd();

// 클라이언트 생성 (연결되지 않았을 경우 더미 URL로 에러 방지)
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder-project.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder-key'
);
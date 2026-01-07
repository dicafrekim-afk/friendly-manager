
import { createClient } from '@supabase/supabase-js';

// Vercel 배포 시 설정할 변수입니다. 설정 전에는 기본 placeholder를 사용합니다.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// 실제 유효한 URL인지 확인 (placeholder가 아닌 경우에만 실제 클라이언트 동작)
export const isSupabaseConfigured = 
  SUPABASE_URL !== 'https://your-project-url.supabase.co' && 
  SUPABASE_ANON_KEY !== 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

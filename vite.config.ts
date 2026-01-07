import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to specify the current directory for loading environment variables.
  // This avoids TypeScript property errors on the 'process' object while correctly loading .env files from the root.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      /**
       * Gemini SDK는 내부적으로 process.env.API_KEY를 참조합니다.
       * Vite는 기본적으로 process 객체를 제공하지 않으므로 여기서 수동으로 주입합니다.
       * Supabase 변수들도 import.meta.env 에러 해결 및 일관성을 위해 동일한 방식으로 주입합니다.
       */
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
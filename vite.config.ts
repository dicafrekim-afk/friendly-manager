import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 환경 변수 로드
  // Fix: Property 'cwd' does not exist on type 'Process' by casting to any in the Node-based config file
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Gemini API 가이드라인에 따라 process.env.API_KEY를 정의합니다.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});
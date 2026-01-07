
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // process.env 정의를 제거하여 Vite의 import.meta.env와 충돌을 방지합니다.
});

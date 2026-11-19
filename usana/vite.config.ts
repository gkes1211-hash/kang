import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' → 어느 주소(하위 폴더 포함)에 올려도 파일을 찾을 수 있게 상대 경로로 빌드
export default defineConfig({
  base: './',
  plugins: [react()],
});

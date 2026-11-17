import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' → 어떤 하위 경로(예: GitHub Pages /repo/pixel-magic-lab/)에 올려도 동작합니다.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as any);

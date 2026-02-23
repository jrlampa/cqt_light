import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
    include: ['src/__tests__/**/*.{test,spec}.{js,jsx}', 'electron/__tests__/**/*.{test,spec}.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}', 'electron/services/**/*.js'],
      exclude: ['src/__tests__/**', 'src/main.jsx']
    }
  }
});

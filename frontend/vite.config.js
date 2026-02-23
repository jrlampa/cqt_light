import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    compression({
      verbose: false,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      verbose: false,
      algorithm: 'brotliCompress',
      ext: '.br',
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    minify: 'terser',
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'leaflet-base': ['leaflet', 'react-leaflet'],
          'ui-icons': ['lucide-react'],
          'pdf-utils': ['jspdf', 'jspdf-autotable'],
          'excel-utils': ['xlsx'],
          'vendor-charts': ['recharts'],
          'vendor-dom': ['html2canvas', 'dompurify'],
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/setupTests.js'],
    },
  },
})

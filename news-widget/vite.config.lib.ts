import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const isIIFE = process.env.BUILD_FORMAT === 'iife';

// Library build configuration (separate from app build)
// https://vite.dev/guide/build.html#library-mode
//
// Two-pass build:
//   Pass 1 (default): ES + UMD with React externalized as peer dependency
//   Pass 2 (BUILD_FORMAT=iife): IIFE with React bundled for standalone <script> usage
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'NewsWidget',
      formats: isIIFE ? ['iife'] : ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'news-widget.js';
        if (format === 'umd') return 'news-widget.umd.cjs';
        return 'news-widget.iife.js';
      },
    },
    rollupOptions: isIIFE ? {} : {
      // Externalize peer dependencies for ES/UMD consumers
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime',
        },
      },
    },
    // Generate source maps for debugging
    sourcemap: true,
    // Only clear output on first pass
    emptyOutDir: !isIIFE,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})

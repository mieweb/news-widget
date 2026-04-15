import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Library build configuration (separate from app build)
// https://vite.dev/guide/build.html#library-mode
//
// Two-pass build:
//   Pass 1 (default mode): ES + UMD with React externalized as peer dependency
//   Pass 2 (--mode iife): IIFE with React bundled for standalone <script> usage
export default defineConfig(({ mode }) => {
  const isIIFE = mode === 'iife'

  return {
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
      // Do not emit source maps in package builds
      sourcemap: false,
      // Only clear output on first pass
      emptyOutDir: !isIIFE,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Library build configuration (separate from app build)
// https://vite.dev/guide/build.html#library-mode
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'NewsWidget',
      formats: ['es', 'umd'],
      fileName: (format) => `news-widget.${format === 'es' ? 'js' : 'umd.cjs'}`,
    },
    rollupOptions: {
      // Externalize peer dependencies (React/ReactDOM)
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
    // Clear output directory
    emptyOutDir: true,
  },
  // Generate TypeScript declarations
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})

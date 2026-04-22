import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

/**
 * Rollup plugin that injects emitted CSS into the JS bundle as inline
 * <style> tags so the IIFE build is fully standalone (single <script> tag).
 */
function cssInjectedByJsPlugin(): Plugin {
  return {
    name: 'css-injected-by-js',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const cssAssets = Object.entries(bundle).filter(
        ([, asset]) => asset.type === 'asset' && asset.fileName.endsWith('.css'),
      );

      if (cssAssets.length === 0) return;

      const jsEntry = Object.values(bundle).find(
        (chunk) => chunk.type === 'chunk' && chunk.isEntry,
      );
      if (!jsEntry || jsEntry.type !== 'chunk') return;

      for (const [key, asset] of cssAssets) {
        const css =
          typeof asset.source === 'string'
            ? asset.source
            : new TextDecoder().decode(asset.source);
        const escaped = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        jsEntry.code =
          `(function(){try{var s=document.createElement("style");s.textContent=\`${escaped}\`;document.head.appendChild(s)}catch(e){console.error("NewsWidget: failed to inject CSS",e)}})();\n` +
          jsEntry.code;
        delete bundle[key];
      }
    },
  };
}

// Library build configuration (separate from app build)
// https://vite.dev/guide/build.html#library-mode
//
// Two-pass build:
//   Pass 1 (default mode): ES + UMD with React externalized as peer dependency
//   Pass 2 (--mode iife): IIFE with React bundled for standalone <script> usage
export default defineConfig(({ mode }) => {
  const isIIFE = mode === 'iife'

  return {
    plugins: [
      tailwindcss(),
      react(),
      ...(isIIFE ? [cssInjectedByJsPlugin()] : []),
    ],
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

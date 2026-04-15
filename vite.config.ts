import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { testDiscourseServer } from './test-server/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Embedded test Discourse server - no separate process needed
    testDiscourseServer(),
  ],
  server: {
    watch: {
      // Exclude test server data files from triggering HMR reloads
      // The Tailwind CSS plugin scans all files for class names, so writing
      // to comments.json during tests triggers unnecessary full page reloads
      ignored: ['**/test-server/comments.json'],
    },
    proxy: {
      // Proxy Discourse API during development to avoid CORS issues
      // In production, the target server should set Access-Control-Allow-Origin
      '/api/rss': {
        target: 'https://community.enterprise.health',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss/, ''),
        secure: true,
        // Forward cookies for auth
        cookieDomainRewrite: 'localhost',
      },
      // Note: /api/test/* is handled by the testDiscourseServer plugin
    },
  },
})

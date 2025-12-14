import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { testDiscourseServer } from './test-server/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Embedded test Discourse server - no separate process needed
    testDiscourseServer(),
  ],
  server: {
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

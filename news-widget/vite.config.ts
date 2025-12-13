import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy RSS feeds during development to avoid CORS issues
      // In production, the target server should set Access-Control-Allow-Origin
      '/api/rss': {
        target: 'https://community.enterprise.health',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss/, ''),
        secure: true,
      },
    },
  },
})

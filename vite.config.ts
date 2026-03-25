import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ ones) for server-side proxy config only.
  // OPENCLAW_API_TOKEN is never exposed to the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 18790,
      proxy: {
        '/api': {
          target: 'http://localhost:18789',
          changeOrigin: true,
          headers: {
            Authorization: `Bearer ${env.OPENCLAW_API_TOKEN ?? ''}`,
          },
        },
        '/ws': {
          target: 'ws://localhost:18789',
          ws: true,
          headers: {
            Authorization: `Bearer ${env.OPENCLAW_API_TOKEN ?? ''}`,
          },
        },
      },
    },
  }
})

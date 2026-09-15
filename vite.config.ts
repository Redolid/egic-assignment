/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { idReaderPlugin } from './server/idReaderPlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix loads every variable from .env files, not only VITE_* ones.
  // ANTHROPIC_API_KEY is used by the server plugin only and never reaches the client bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const mlServiceUrl = env.ML_SERVICE_URL || 'http://127.0.0.1:8008'

  // The local deep-learning service (ml-service/) is reached same-origin under /api/ml.
  const proxy = {
    '/api/ml': {
      target: mlServiceUrl,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\/ml/, ''),
    },
  }

  return {
    plugins: [react(), tailwindcss(), idReaderPlugin(env.ANTHROPIC_API_KEY)],
    server: { proxy },
    preview: { proxy },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }
})

import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: true,
    proxy: {
      '/socket.io': { target: process.env.LUNA_SERVER_URL ?? 'http://localhost:3001', ws: true },
      '/api': { target: process.env.LUNA_SERVER_URL ?? 'http://localhost:3001' }
    }
  },
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'], css: false }
})

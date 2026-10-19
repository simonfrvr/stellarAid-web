/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // #851 — split the heavy, version-stable vendors out of the app bundle so the
  // marketing/auth shell does not pay for the whole commerce flow up front, and
  // so a runtime error in production is debuggable against real source maps.
  build: {
    sourcemap: true,
    target: 'es2020',
    // Route-level chunks plus the vendor chunks below should keep every chunk
    // well under this; a warning here means a chunk regressed.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) only accepts the function form of manualChunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return null
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'react'
          }
          if (id.includes('@tanstack/react-query')) return 'query'
          if (id.includes('@stellar/freighter-api')) return 'stellar'
          return null
        },
      },
    },
  },
  // Vitest shares this config so the `@/` alias stays a single source of truth
  // for dev, build and tests (#791). Explicit imports stay mandatory
  // (`globals: false`), matching the existing test files.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    globals: false,
  },
})

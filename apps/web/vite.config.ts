import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
// NOTE: Do NOT add vite-plugin-eslint here — ESLint runs as a standalone `pnpm lint` script
// to avoid adding 50-300ms overhead to every HMR cycle.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

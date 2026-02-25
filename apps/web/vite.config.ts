import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
  server: {
    // item-019: Aspire injects PORT as an env var when orchestrating the dev server.
    // Reading from process.env (not CLI --port) ensures cross-platform compatibility.
    port: parseInt(process.env['PORT'] ?? '5173', 10),
    strictPort: true,
  },
})

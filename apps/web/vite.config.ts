import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveServerPort(): number {
  const rawPort = process.env['PORT']
  if (!rawPort) return 5173

  // Accept only plain integer strings to avoid partial parses (e.g. "3000abc").
  if (!/^\d+$/.test(rawPort)) return 5173

  const parsed = Number.parseInt(rawPort, 10)
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) return 5173

  return parsed
}

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
    // localhost-only dev server for safer defaults in shared/dev environments.
    host: '127.0.0.1',
    // item-019: Aspire injects PORT as an env var when orchestrating the dev server.
    // Reading from process.env (not CLI --port) ensures cross-platform compatibility.
    // Red-team hardening: sanitize malformed/out-of-range env input with safe fallback.
    port: resolveServerPort(),
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
  },
})

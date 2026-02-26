import { spawn } from 'node:child_process'

const timeoutMs = 90000
const command = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet'
const args = ['run', '--project', 'apps/AppHost']

const child = spawn(command, args, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DOTNET_ENVIRONMENT: 'Development',
    ASPNETCORE_ENVIRONMENT: 'Development',
    PORT: process.env.PORT ?? '5050',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let output = ''
let resolved = false

const done = (code, message) => {
  if (resolved) return
  resolved = true
  clearTimeout(timer)
  try { child.kill('SIGTERM') } catch {}
  const normalized = output.replace(/\r/g, '')
  if (code === 0) {
    console.log('[verify-apphost-port-smoke] PASS')
    console.log(message)
    process.exit(0)
  }
  console.error('[verify-apphost-port-smoke] FAIL')
  console.error(message)
  console.error('\n--- Captured output ---\n' + normalized.slice(-8000))
  process.exit(1)
}

const check = () => {
  const normalized = output.replace(/\r/g, '')
  const hasDistributedStarted = /Distributed application started\.?/i.test(normalized)
  const hasDashboardListening = /Now listening on:\s+https?:\/\/localhost:\d+/i.test(normalized)

  if (hasDistributedStarted && hasDashboardListening) {
    done(0, 'Detected distributed application startup and dashboard listening on dynamic localhost port.')
  }
}

child.stdout.on('data', (chunk) => {
  output += chunk.toString()
  check()
})

child.stderr.on('data', (chunk) => {
  output += chunk.toString()
  check()
})

child.on('exit', (code) => {
  if (!resolved) {
    done(1, `AppHost exited before smoke conditions were met (exit code ${code ?? 'null'}).`)
  }
})

const timer = setTimeout(() => {
  done(1, `Timed out after ${timeoutMs}ms waiting for AppHost orchestration startup markers.`)
}, timeoutMs)

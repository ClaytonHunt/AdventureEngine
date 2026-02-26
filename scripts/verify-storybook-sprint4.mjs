import { readFileSync, existsSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'

const fail = (msg) => {
  console.error('[verify-storybook-sprint4] FAIL')
  console.error(msg)
  process.exit(1)
}

const storiesPath = 'apps/web/src/components/Button/Button.stories.tsx'
if (!existsSync(storiesPath)) {
  fail(`Missing required story file: ${storiesPath}`)
}

const storySource = readFileSync(storiesPath, 'utf8')
const requiredStories = ['Default', 'Disabled']
for (const name of requiredStories) {
  if (!new RegExp(`export\\s+const\\s+${name}\\s*:`, 'm').test(storySource)) {
    fail(`Required Button story state missing: ${name}`)
  }
}

const requiredInteractionStates = ['pseudo: { hover: true }', 'pseudo: { focusVisible: true }']
for (const token of requiredInteractionStates) {
  if (!storySource.includes(token)) {
    fail(`Required interaction state not found in Button stories: ${token}`)
  }
}

try {
  rmSync('apps/web/storybook-static', { recursive: true, force: true })
} catch {}

execSync('pnpm --filter web build-storybook', { stdio: 'inherit' })

if (!existsSync('apps/web/storybook-static/index.html')) {
  fail('Storybook build output missing expected index.html in apps/web/storybook-static')
}

execSync('pnpm --filter web build', { stdio: 'inherit' })

if (!existsSync('apps/web/dist/index.html')) {
  fail('Web production build output missing apps/web/dist/index.html')
}

const appIndex = readFileSync('apps/web/dist/index.html', 'utf8')
if (/storybook/i.test(appIndex)) {
  fail('Production web artifact unexpectedly references storybook assets/routes.')
}

console.log('[verify-storybook-sprint4] PASS')
console.log('Button baseline stories and interaction states found; Storybook builds and production web artifact has no Storybook reference.')

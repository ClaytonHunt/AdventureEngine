import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'
import { join, dirname } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

/**
 * Resolve the absolute path of a Storybook package.
 * Required for monorepo / pnpm workspace setups where packages may be hoisted.
 */
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite') as '@storybook/react-vite',
    options: {},
  },
  /**
   * item-008: Wire the @/ path alias from vite.config.ts into Storybook's Vite build.
   * This prevents import resolution failures in stories that use @/ imports.
   */
  viteFinal: async (config) => {
    const { default: viteConfig } = await import('../vite.config.ts')
    return mergeConfig(config, {
      resolve: {
        alias: viteConfig.resolve?.alias ?? {},
      },
    })
  },
}

export default config

import type { Preview } from '@storybook/react-vite'

// Import design tokens so CSS custom properties resolve in all stories.
import '@/styles/tokens.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview

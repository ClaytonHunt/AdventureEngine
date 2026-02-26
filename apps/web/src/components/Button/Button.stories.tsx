import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual style of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    disabled: {
      control: 'boolean',
      description:
        'When true, uses aria-disabled + tabIndex=-1 (not native disabled). ' +
        'The button remains in the accessibility tree for tooltip support.',
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type. Defaults to "button" to prevent accidental form submission.',
    },
    onClick: { action: 'clicked' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

/** Default primary button in medium size. */
export const Default: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md',
  },
}

/**
 * All three variants (primary, secondary, danger) rendered side by side.
 * Use this story to compare visual styling between variants.
 */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
}

/**
 * Disabled state.
 * Note: uses aria-disabled + tabIndex=-1, NOT the native `disabled` attribute,
 * so the element remains discoverable by assistive technology.
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    variant: 'primary',
    disabled: true,
  },
}

export const Hover: Story = {
  args: {
    children: 'Hover state',
    variant: 'primary',
  },
  parameters: {
    pseudo: { hover: true },
  },
}

export const FocusVisible: Story = {
  args: {
    children: 'Focus-visible state',
    variant: 'primary',
  },
  parameters: {
    pseudo: { focusVisible: true },
  },
}

/**
 * All three sizes (sm, md, lg) rendered side by side for comparison.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

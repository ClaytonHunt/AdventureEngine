import type { Meta, StoryObj } from '@storybook/react'
import './Button.css'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Click me',
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

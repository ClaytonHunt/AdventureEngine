import React from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  /** Visual style of the button. Defaults to 'primary'. */
  variant?: ButtonVariant
  /** Size of the button. Defaults to 'md'. */
  size?: ButtonSize
  /**
   * When true, the button appears disabled and ignores clicks.
   * Uses aria-disabled + tabIndex=-1 (not native `disabled`) so the element
   * remains focusable for tooltips and retains its accessible label in AT.
   */
  disabled?: boolean
  /** Called when the button is clicked (ignored when disabled). */
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  /** Button content. */
  children: React.ReactNode
  /**
   * HTML button type. Defaults to 'button' to prevent accidental form submission.
   * Set to 'submit' or 'reset' explicitly when used inside a <form>.
   */
  type?: 'button' | 'submit' | 'reset'
  /** Additional CSS class names merged with the button's own classes. */
  className?: string
}

/**
 * Primary interactive element for triggering actions.
 *
 * Supports three visual variants (primary, secondary, danger) and three sizes
 * (sm, md, lg). Exposes a forwarded ref for programmatic focus management.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      onClick,
      children,
      type = 'button',
      className = '',
    },
    ref,
  ) => {
    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        onClick={disabled ? undefined : onClick}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }

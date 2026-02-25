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
   * When true, the button appears disabled and ignores clicks and keyboard activation.
   * Uses aria-disabled + tabIndex=-1 (not native `disabled`) so the element
   * remains discoverable by assistive technology and compatible with tooltips.
   *
   * IMPORTANT: Because this does NOT use the native `disabled` attribute, a button
   * with `disabled={true}` and `type="submit"` inside a <form> will NOT prevent form
   * submission via programmatic form.submit() calls. Always guard form submission
   * logic explicitly when composing Button inside forms.
   */
  disabled?: boolean
  /** Called when the button is clicked (ignored when disabled). */
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  /** Button content. */
  children: React.ReactNode
  /**
   * HTML button type. Defaults to 'button' to prevent accidental form submission.
   * Set to 'submit' or 'reset' explicitly when used inside a <form>.
   *
   * NOTE: type="submit" + disabled={true} does NOT prevent form submission because
   * this component uses aria-disabled (not the native disabled attribute). The form
   * will still submit if submitted programmatically or via another submit trigger.
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

    // Prevent keyboard-initiated activation (Enter/Space) from firing when disabled.
    // onClick={undefined} stops pointer clicks, but native button keydown events
    // still fire and bubble even without an onClick handler.
    const handleKeyDown = disabled
      ? (e: React.KeyboardEvent<HTMLButtonElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
          }
        }
      : undefined

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        onClick={disabled ? undefined : onClick}
        onKeyDown={handleKeyDown}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }

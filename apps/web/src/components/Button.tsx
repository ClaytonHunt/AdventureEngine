import type { ButtonHTMLAttributes } from 'react'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ type = 'button', className = '', ...props }: ButtonProps) {
  const mergedClassName = ['ae-button', className].filter(Boolean).join(' ')

  return <button type={type} className={mergedClassName} {...props} />
}

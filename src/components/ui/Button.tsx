import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  // Primary runs on the current tool's pipe colour.
  primary: 'bg-accent text-on-accent shadow-panel hover:bg-accent-strong',
  secondary: 'border border-line bg-surface text-fg shadow-panel hover:border-line-strong hover:bg-surface-2',
  ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
  danger: 'text-fg-muted hover:bg-fail-soft hover:text-fail',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.8125rem] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
}

/** Pill-shaped like a pipe segment. */
export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 select-none items-center rounded-full font-medium transition-[background-color,color,border-color,box-shadow,scale] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}

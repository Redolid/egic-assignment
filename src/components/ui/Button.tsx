import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  // Cobalt fill is reserved for the one action a sheet section exists for.
  primary: 'bg-cobalt-600 text-white hover:bg-cobalt-700 active:bg-cobalt-800',
  secondary: 'bg-white text-ink-900 ring-1 ring-inset ring-ink-950 hover:bg-ink-950 hover:text-white',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-950',
  danger: 'text-ink-600 hover:bg-fail-50 hover:text-fail-700',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[0.8125rem] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
}

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 select-none items-center rounded-[3px] font-semibold transition-[background-color,color,box-shadow,scale] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt-600 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}

import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-[0_1px_2px_rgb(15_23_42/0.2),inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-brand-700',
  secondary: 'bg-white text-slate-700 shadow-xs ring-1 ring-slate-300 hover:bg-slate-50 hover:ring-slate-400',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  danger: 'text-slate-500 hover:bg-red-100/60 hover:text-red-700',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 select-none items-center rounded-lg font-medium transition-[background-color,color,box-shadow,scale] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}

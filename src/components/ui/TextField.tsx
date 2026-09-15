import { useId } from 'react'
import type { ComponentProps } from 'react'
import { FieldMessage } from './FieldMessage'

interface TextFieldProps extends ComponentProps<'input'> {
  label: string
  error?: string | null
}

/** Labelled input with an accessible, animated error message. */
export function TextField({ label, error, className = '', ...inputProps }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium text-slate-600">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-400 focus:ring-4 ${
          error
            ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100'
            : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-100'
        }`}
        {...inputProps}
      />
      <FieldMessage id={errorId} message={error} />
    </div>
  )
}

import { useId } from 'react'
import type { ComponentProps } from 'react'
import { FieldMessage } from './FieldMessage'

interface TextFieldProps extends ComponentProps<'input'> {
  label: string
  error?: string | null
}

/** Labelled field with an accessible, animated error message. */
export function TextField({ label, error, className = '', ...inputProps }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`h-11 w-full rounded-[var(--radius-fitting)] border bg-surface px-3.5 text-sm text-fg outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-fg-subtle focus:ring-4 ${
          error
            ? 'border-fail bg-fail-soft focus:ring-fail-soft'
            : 'border-line hover:border-line-strong focus:border-accent focus:ring-accent-soft'
        }`}
        {...inputProps}
      />
      <FieldMessage id={errorId} message={error} />
    </div>
  )
}

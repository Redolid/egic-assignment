import { useId } from 'react'
import type { ComponentProps } from 'react'
import { FieldMessage } from './FieldMessage'

interface TextFieldProps extends ComponentProps<'input'> {
  label: string
  error?: string | null
}

/** Labelled spec-sheet field with an accessible, animated error message. */
export function TextField({ label, error, className = '', ...inputProps }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="spec-label">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`h-10 w-full rounded-[3px] border bg-white px-3 text-sm text-ink-950 outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-ink-400 focus:ring-[3px] ${
          error
            ? 'border-fail-600 bg-fail-50/50 focus:ring-fail-600/15'
            : 'border-ink-300 hover:border-ink-500 focus:border-cobalt-600 focus:ring-cobalt-600/15'
        }`}
        {...inputProps}
      />
      <FieldMessage id={errorId} message={error} />
    </div>
  )
}

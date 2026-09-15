import { useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { FieldMessage } from '../../../components/ui/FieldMessage'
import { prefersReducedMotion } from '../../../lib/motion'
import type { ValidationResult } from '../lib/validation'

interface EditableNumberCellProps {
  value: number
  /** Accessible label, e.g. "Quantity of Oil Filter". */
  label: string
  validate: (raw: string) => ValidationResult<number>
  onCommit: (value: number) => void
  inputMode: 'numeric' | 'decimal'
}

/**
 * Inline number editor.
 * - Keeps the raw text the user types as a local draft.
 * - Every valid keystroke is committed immediately, so totals update live.
 * - Invalid text shows an error and is NOT committed; on blur / Escape the
 *   draft reverts to the last valid value, with a brief flash so the undo is noticed.
 */
export function EditableNumberCell({ value, label, validate, onCommit, inputMode }: EditableNumberCellProps) {
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(String(value))
  const [error, setError] = useState<string | null>(null)

  // Sync the draft when the value changes from outside (e.g. "Reset demo data").
  // Typing "12." commits 12, so Number(draft) === value and the draft is kept.
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (Number(draft) !== value) {
      setDraft(String(value))
      setError(null)
    }
  }

  const handleChange = (raw: string) => {
    setDraft(raw)
    const result = validate(raw)
    if (result.ok) {
      setError(null)
      if (result.value !== value) onCommit(result.value)
    } else {
      setError(result.error)
    }
  }

  const revert = () => {
    setDraft(String(value))
    setError(null)
    inputRef.current?.animate(
      [{ backgroundColor: '#fef3c7' }, { backgroundColor: '#ffffff' }],
      { duration: prefersReducedMotion() ? 400 : 700, easing: 'ease-out' },
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      if (error) revert()
      event.currentTarget.blur()
    }
  }

  return (
    <div className="flex flex-col items-end sm:items-stretch">
      <input
        ref={inputRef}
        // type="text" + inputMode gives a numeric mobile keyboard while letting us
        // validate exactly what was typed (type="number" silently turns "1e" into "").
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        value={draft}
        aria-label={label}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={() => error && revert()}
        onKeyDown={handleKeyDown}
        className={`h-9 w-28 rounded-md border bg-white px-2 text-right text-sm tabular-nums text-slate-900 outline-none transition-[border-color,box-shadow] duration-200 focus:ring-4 sm:w-full ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
            : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-100'
        }`}
      />
      <FieldMessage id={errorId} message={error} align="end" live />
    </div>
  )
}

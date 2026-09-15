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
  /** How the value is shown when not being typed, e.g. prices with two decimals. */
  formatValue?: (value: number) => string
}

const plain = (value: number) => String(value)

/**
 * Inline number editor.
 * - Keeps the raw text the user types as a local draft.
 * - Every valid keystroke is committed immediately, so totals update live.
 * - Invalid text shows an error and is NOT committed; on blur / Escape the
 *   draft reverts to the last valid value, with a brief flash so the undo is noticed.
 */
export function EditableNumberCell({ value, label, validate, onCommit, inputMode, formatValue = plain }: EditableNumberCellProps) {
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(formatValue(value))
  const [error, setError] = useState<string | null>(null)

  // Sync the draft when the value changes from outside (e.g. a merge or "Reset demo data").
  // Typing "12." commits 12, so Number(draft) === value and the draft is kept.
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (Number(draft) !== value) {
      setDraft(formatValue(value))
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
    setDraft(formatValue(value))
    setError(null)
    inputRef.current?.animate([{ backgroundColor: '#fdf4e4' }, { backgroundColor: '#ffffff' }], {
      duration: prefersReducedMotion() ? 400 : 700,
      easing: 'ease-out',
    })
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
        onBlur={() => (error ? revert() : setDraft(formatValue(value)))}
        onKeyDown={handleKeyDown}
        className={`figures h-8 w-28 rounded-[3px] border bg-white px-2 text-right text-sm text-ink-950 outline-none transition-[border-color,box-shadow] duration-200 focus:ring-[3px] sm:w-full ${
          error
            ? 'border-fail-600 focus:ring-fail-600/15'
            : 'border-ink-200 hover:border-ink-400 focus:border-cobalt-600 focus:ring-cobalt-600/15'
        }`}
      />
      <FieldMessage id={errorId} message={error} align="end" live />
    </div>
  )
}

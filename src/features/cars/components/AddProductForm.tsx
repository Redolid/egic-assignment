import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { CheckIcon, PlusIcon } from '../../../components/ui/Icons'
import { TextField } from '../../../components/ui/TextField'
import { shake } from '../../../lib/motion'
import { validateName, validatePrice, validateQuantity } from '../lib/validation'
import type { ChangeOutcome } from '../state/CarsContext'
import type { ProductInput } from '../types'

interface AddProductFormProps {
  carName: string
  onAdd: (input: ProductInput) => ChangeOutcome
}

const emptyForm = { name: '', quantity: '1', unitPrice: '' }
type FormValues = typeof emptyForm

function validateForm(values: FormValues) {
  const name = validateName(values.name)
  const quantity = validateQuantity(values.quantity)
  const unitPrice = validatePrice(values.unitPrice)

  const errors = {
    name: name.ok ? null : name.error,
    quantity: quantity.ok ? null : quantity.error,
    unitPrice: unitPrice.ok ? null : unitPrice.error,
  }
  const input: ProductInput | null =
    name.ok && quantity.ok && unitPrice.ok ? { name: name.value, quantity: quantity.value, unitPrice: unitPrice.value } : null

  return { errors, input }
}

export function AddProductForm({ carName, onAdd }: AddProductFormProps) {
  const [values, setValues] = useState<FormValues>(emptyForm)
  // Errors only appear after the first submit attempt, then update as the user types.
  const [submitted, setSubmitted] = useState(false)
  const [rejections, setRejections] = useState(0)
  const [receipt, setReceipt] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const { errors, input } = validateForm(values)
  const visibleErrors = submitted ? errors : { name: null, quantity: null, unitPrice: null }

  // A rejected submit shakes exactly the fields that are wrong and moves focus to the first one.
  useEffect(() => {
    if (!rejections || !formRef.current) return
    const invalid = formRef.current.querySelectorAll<HTMLInputElement>('input[aria-invalid="true"]')
    invalid.forEach((field) => shake(field))
    invalid[0]?.focus()
  }, [rejections])

  useEffect(() => {
    if (!receipt) return
    const timer = window.setTimeout(() => setReceipt(null), 3200)
    return () => window.clearTimeout(timer)
  }, [receipt])

  const setField = (field: keyof FormValues) => (value: string) => setValues((current) => ({ ...current, [field]: value }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (!input) {
      setRejections((count) => count + 1)
      return
    }

    const outcome = onAdd(input)
    setReceipt(
      outcome.merged
        ? `${input.name} is already on this vehicle at this price — quantity is now ${outcome.quantity}.`
        : `${input.name} added as a new line.`,
    )
    setValues(emptyForm)
    setSubmitted(false)
    nameRef.current?.focus()
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate aria-label={`Add a line to ${carName}`} className="rounded-[var(--radius-bend)] bg-surface-2 px-3 py-3 sm:px-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_6.5rem_8.5rem_auto] sm:items-start">
        <TextField
          ref={nameRef}
          label="Add line · part name"
          placeholder="e.g. Oil Filter"
          value={values.name}
          error={visibleErrors.name}
          onChange={(event) => setField('name')(event.target.value)}
          className="col-span-2 sm:col-span-1"
        />
        <TextField
          label="Qty"
          inputMode="numeric"
          value={values.quantity}
          error={visibleErrors.quantity}
          onChange={(event) => setField('quantity')(event.target.value)}
          className="[&_input]:tabular-nums [&_input]:text-right"
        />
        <TextField
          label="Unit price, EGP"
          inputMode="decimal"
          placeholder="0.00"
          value={values.unitPrice}
          error={visibleErrors.unitPrice}
          onChange={(event) => setField('unitPrice')(event.target.value)}
          className="[&_input]:tabular-nums [&_input]:text-right"
        />
        <Button
          type="submit"
          className={`col-span-2 justify-center sm:col-span-1 sm:mt-[1.4rem] ${receipt ? 'bg-pass! hover:bg-pass!' : ''}`}
        >
          {/* The plus turns into a check for a moment: the line was accepted. */}
          <span className="relative grid h-4 w-4 place-items-center">
            <PlusIcon
              width={16}
              height={16}
              className={`absolute transition-[rotate,scale,opacity] duration-300 ease-[var(--ease-out)] ${
                receipt ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />
            <CheckIcon
              width={16}
              height={16}
              className={`absolute transition-[scale,opacity] duration-300 ease-[var(--ease-out)] ${
                receipt ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            />
          </span>
          {receipt ? 'Added' : 'Add line'}
        </Button>
      </div>
      <p aria-live="polite" className="min-h-0 text-xs text-fg-muted empty:hidden">
        {receipt && <span className="mt-2 block motion-safe:animate-reveal-down">{receipt}</span>}
      </p>
    </form>
  )
}
